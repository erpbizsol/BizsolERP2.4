import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { PayTypeMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/PayTypeMasterService.js';

var G_PT_SourceRows = [];
var G_PT_DetailMode = 'list';
var G_Users = [];
var G_UserGroups = [];
var G_AccountGroups = [];
var G_LookupsPromise = null;

var PT_DEFAULT_HIERARCHY = { 1: 'Check', 2: 'Verify', 3: 'Approve' };
var PT_MIN_LEVELS = 3;

var ptHasNewRight = false;
var ptHasEditRight = false;
var ptHasViewRight = false;
var ptHasDeleteRight = false;

var PT_GRID_STRING_FILTERS = ['Description', 'Account group', 'Manual', 'Salary', 'Active'];

function getFinancialYear() {
    return BizSolHelperFunction.getFinancialYear();
}

function getPtModuleName() {
    return ($('#ERPHeading').text() || '').trim();
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

function yn(val) {
    return String(val || '').toUpperCase() === 'Y' ? 'Y' : 'N';
}

function fillAccountGroupSelect(selectedCode) {
    var $sel = $('#ddlPtAccountGroup');
    var prev;
    if (arguments.length === 0) {
        prev = $sel.val() || '';
    } else if (selectedCode == null || selectedCode === '') {
        prev = '';
    } else {
        prev = String(selectedCode);
    }
    $sel.empty().append(new Option('-- Select --', ''));
    (G_AccountGroups || []).forEach(function (row) {
        if (row.Code == null || row.Code === '') return;
        var accountDesp = row.AccountDesp != null ? row.AccountDesp : row.accountDesp;
        $sel.append(new Option(accountDesp || String(row.Code), String(row.Code)));
    });
    if (prev && $sel.find('option').filter(function () { return this.value === prev; }).length) {
        $sel.val(prev);
    } else {
        $sel.val('');
    }
    initAccountGroupSelect2();
}

function initAccountGroupSelect2() {
    var $sel = $('#ddlPtAccountGroup');
    if ($sel.data('select2')) $sel.select2('destroy');
    $sel.select2({
        width: '100%',
        placeholder: '-- Select --',
        minimumResultsForSearch: 0
    });
    syncPayTypeTabOrder();
}

/** Tab follows DOM order; no positive tabindex because Select2 rewrites tabindex on enable/attribute changes. */
function syncPayTypeTabOrder() {
    $('#btnSavePt, #btnClearPt, #btnBackToList, #btnPtAddLevel, #tblPtVerification .pt-remove-level').attr('tabindex', -1);
}

function focusAccountGroup() {
    $('#ddlPtAccountGroup').select2('open');
}

function joinMasterCodes(val) {
    var list = val == null || val === '' ? [] : (Array.isArray(val) ? val : [val]);
    return list.map(function (x) { return String(x || '').trim(); }).filter(Boolean).join(',');
}

function showModal(id) {
    try {
        var el = document.getElementById(id);
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
        var el = document.getElementById(id);
        if (window.bootstrap && window.bootstrap.Modal) {
            var m = window.bootstrap.Modal.getInstance(el);
            if (m) m.hide();
        } else {
            $('#' + id).modal('hide');
        }
    } catch (e) {
        $('#' + id).modal('hide');
    }
}

function checkRight(optionName) {
    return MenuService.CheckModuleOptionRight(getPtModuleName(), optionName, 'Y', getFinancialYear()).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return false;
        }
        return true;
    });
}

function detailOpen() {
    return $('#dvPtEntry').hasClass('pt-entry-visible');
}

function destroySelect2($sel) {
    if (!$sel || !$sel.length) return;
    try {
        if ($sel.data('select2')) $sel.select2('destroy');
    } catch (e) {}
    $sel.removeClass('select2-hidden-accessible');
    $sel.removeAttr('data-select2-id tabindex aria-hidden');
    $sel.siblings('.select2-container').remove();
}

function destroyEntrySelect2() {
    $('#tblPtVerification tbody .pt-users, #tblPtVerification tbody .pt-usergroups').each(function () {
        destroySelect2($(this));
    });
}

function setUserGroupCodes($row, codesCsv) {
    fillMultiCodeSelect($row.find('.pt-usergroups'), G_UserGroups, 'GroupName', codesCsv);
}

function nextVerificationLevel() {
    var maxLevel = 0;
    $('#tblPtVerification tbody tr').each(function () {
        var level = parseInt($(this).attr('data-level'), 10) || 0;
        if (level > maxLevel) maxLevel = level;
    });
    return maxLevel + 1;
}

function fillMultiCodeSelect($sel, rows, textField, codesCsv) {
    var selected = String(codesCsv || '')
        .split(',')
        .map(function (x) { return x.trim(); })
        .filter(Boolean);
    $sel.empty();
    (rows || []).forEach(function (row) {
        if (!row.Code) return;
        $sel.append(new Option(row[textField] || String(row.Code), String(row.Code)));
    });
    selected.forEach(function (c) {
        if (!$sel.find('option').filter(function () { return this.value === c; }).length) {
            $sel.append(new Option(c, c));
        }
    });
    $sel.val(selected.length ? selected : null);
}

function syncVerificationMultiEmpty($sel) {
    if (!$sel || !$sel.length) return;
    var val = $sel.val();
    var empty = val == null || val === '' || (Array.isArray(val) && !val.length);
    $sel.next('.select2-container').toggleClass('pt-multi-empty', empty);
}

function clearSelect2SearchField($sel) {
    if (!$sel || !$sel.length) return;
    var $search = $sel.next('.select2-container').find('.select2-search__field');
    $search.val('');
    window.setTimeout(function () { $search.val(''); }, 0);
}

function initVerificationMultiSelect2($sel, placeholder) {
    destroySelect2($sel);
    $sel.select2({
        width: '100%',
        placeholder: placeholder,
        allowClear: false,
        minimumResultsForSearch: 0,
        dropdownParent: $(document.body),
        closeOnSelect: false
    });
    $sel.off('change.ptMultiEmpty select2:select.ptMultiEmpty select2:unselect.ptMultiEmpty')
        .on('change.ptMultiEmpty select2:unselect.ptMultiEmpty', function () {
            syncVerificationMultiEmpty($sel);
        })
        .on('select2:select.ptMultiEmpty', function () {
            syncVerificationMultiEmpty($sel);
            clearSelect2SearchField($sel);
        });
    syncVerificationMultiEmpty($sel);
}

function initVerificationRowSelect2($row) {
    if (!$row.length || typeof $.fn.select2 !== 'function' || !detailOpen()) return;
    initVerificationMultiSelect2($row.find('.pt-users'), 'Select users');
    initVerificationMultiSelect2($row.find('.pt-usergroups'), 'Select user groups');
    var $ugSearch = $row.find('.pt-usergroups').next('.select2-container').find('.select2-search__field');
    $ugSearch.off('keydown.ptUgTab');
    $ugSearch.on('keydown.ptUgTab', function (e) {
        if (e.key === 'Tab' && !e.shiftKey && $row.is($('#tblPtVerification tbody tr').last())) {
            e.preventDefault();
            $('#btnSavePt').focus();
        }
    });
}

function syncRemoveLevelButtons() {
    $('#tblPtVerification tbody tr').each(function () {
        var level = parseInt($(this).attr('data-level'), 10) || 0;
        $(this).find('.pt-remove-level').toggle(level > PT_MIN_LEVELS);
    });
}

function addVerificationLevel(level, hierarchy, userCodesCsv, userGroupCodesCsv, skipSelect2) {
    var rowLevel = level || nextVerificationLevel();
    var label = hierarchy || PT_DEFAULT_HIERARCHY[rowLevel] || '';
    var $row = $(
        '<tr data-level="' + rowLevel + '">'
        + '<td class="pt-td-level">' + rowLevel + '</td>'
        + '<td><input type="text" class="pt-hierarchy" maxlength="50" autocomplete="off" /></td>'
        + '<td><select class="pt-users" multiple="multiple"></select></td>'
        + '<td><select class="pt-usergroups" multiple="multiple"></select></td>'
        + '<td class="pt-td-action"><button type="button" class="pt-remove-level" title="Remove"><i class="fas fa-times"></i></button></td>'
        + '</tr>'
    );
    $('#tblPtVerification tbody').append($row);
    $row.find('.pt-hierarchy').val(label);
    fillMultiCodeSelect($row.find('.pt-users'), G_Users, 'UserName', userCodesCsv);
    setUserGroupCodes($row, userGroupCodesCsv);
    if (!skipSelect2) initVerificationRowSelect2($row);
    syncRemoveLevelButtons();
    syncPayTypeTabOrder();
    return $row;
}

function resetDefaultVerificationLevels() {
    $('#tblPtVerification tbody').empty();
    addVerificationLevel(1, 'Check', '', '', true);
    addVerificationLevel(2, 'Verify', '', '', true);
    addVerificationLevel(3, 'Approve', '', '', true);
}

function initAllEntrySelect2() {
    $('#tblPtVerification tbody tr').each(function () {
        initVerificationRowSelect2($(this));
    });
    syncPayTypeTabOrder();
}

function setDetailFormMode(mode) {
    G_PT_DetailMode = mode;
    var ro = mode === 'view';
    $('#PayTypeMasterPage').toggleClass('pt-readonly', ro);
    $('#txtPtDesp, #ddlPtAccountGroup, #chkPtAllowManual, #chkPtIsSalary').prop('disabled', ro);
    $('#tblPtVerification .pt-hierarchy, #tblPtVerification .pt-users, #tblPtVerification .pt-usergroups').each(function () {
        var $el = $(this);
        $el.prop('disabled', ro);
        if ($el.data('select2')) {
            try {
                if (ro) $el.select2('close');
                $el.select2('enable', !ro);
            } catch (e) {}
        }
    });
}

function clearForm() {
    $('#hfPtCode').val('0');
    $('#hfPtIsActive').val('Y');
    $('#txtPtDesp').val('');
    $('#chkPtAllowManual').prop('checked', false);
    $('#chkPtIsSalary').prop('checked', false);
    fillAccountGroupSelect('');
    destroyEntrySelect2();
    resetDefaultVerificationLevels();
    window.setTimeout(initAllEntrySelect2, 0);
}

function showListPanel() {
    G_PT_DetailMode = 'list';
    destroyEntrySelect2();
    $('#PayTypeMasterPage').removeClass('pt-readonly');
    $('#dvPtEntry').removeClass('pt-entry-visible');
    $('#dvPtList').removeClass('pt-list-hidden');
    return loadLocateList();
}

function showDetailPanel(mode) {
    $('#dvPtList').addClass('pt-list-hidden');
    $('#dvPtEntry').addClass('pt-entry-visible');
    setDetailFormMode(mode === 'view' ? 'view' : 'edit');
    syncPayTypeTabOrder();
}

function loadLookups(forceRefresh) {
    if (forceRefresh) G_LookupsPromise = null;
    if (G_LookupsPromise) return G_LookupsPromise;
    G_LookupsPromise = Promise.all([
        PayTypeMasterService.GetUserMasterList().then(function (res) {
            G_Users = firstArray(res);
        }).catch(function () {
            G_Users = [];
            toastr.error('Error loading user list.');
        }),
        PayTypeMasterService.GetUserGroupMasterList().then(function (res) {
            G_UserGroups = firstArray(res);
        }).catch(function () {
            G_UserGroups = [];
            toastr.error('Error loading user group list.');
        }),
        PayTypeMasterService.GetAccountGroupMasterList().then(function (res) {
            G_AccountGroups = firstArray(res);
            fillAccountGroupSelect();
        }).catch(function () {
            G_AccountGroups = [];
            fillAccountGroupSelect();
            toastr.error('Error loading account group list.');
        })
    ]).then(function () { return true; }).catch(function () {
        G_LookupsPromise = null;
        return false;
    });
    return G_LookupsPromise;
}

function loadEditRecord(code, mode) {
    if (typeof window.Showloader === 'function') window.Showloader();
    return PayTypeMasterService.GetByCode(code)
        .then(function (res) {
            var header = res.Header || res.header || {};
            var levelLines = firstArray(res.Transactions || res.transactions);
            $('#hfPtCode').val(header.Code != null ? header.Code : code);
            $('#txtPtDesp').val(header.Desp || '');
            $('#hfPtIsActive').val(yn(header.IsActive) === 'N' ? 'N' : 'Y');
            $('#chkPtAllowManual').prop('checked', yn(header.AllowManual) === 'Y');
            $('#chkPtIsSalary').prop('checked', yn(header.IsSalary) === 'Y');
            fillAccountGroupSelect(
                header.AccountMaster_CodeAllowedGroup != null
                    ? header.AccountMaster_CodeAllowedGroup
                    : header.accountMaster_CodeAllowedGroup
            );
            destroyEntrySelect2();
            $('#tblPtVerification tbody').empty();
            if (!levelLines.length) {
                resetDefaultVerificationLevels();
            } else {
                levelLines.forEach(function (line) {
                    addVerificationLevel(
                        line.Level,
                        line.ApprovalHierarchy || '',
                        line.UserMaster_Codes || '',
                        line.UserGroupMaster_Codes || '',
                        true
                    );
                });
            }
            window.setTimeout(function () {
                initAllEntrySelect2();
                syncRemoveLevelButtons();
            }, 0);
            setDetailFormMode(mode || 'edit');
        })
        .catch(function () {
            toastr.error('Error loading pay type.');
        })
        .finally(function () {
            if (typeof window.HideLoader === 'function') window.HideLoader();
        });
}

function focusApprovalLevelField($tr, selector) {
    if (!$tr || !$tr.length) return;
    var rowEl = $tr[0];
    if (rowEl && rowEl.scrollIntoView) {
        rowEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    var $field = $tr.find(selector);
    if (!$field.length) return;
    if ($field.hasClass('pt-users') || $field.hasClass('pt-usergroups')) {
        if (typeof $.fn.select2 !== 'undefined' && $field.data('select2')) {
            try {
                $field.select2('open');
            } catch (e) {}
        }
        return;
    }
    $field.focus();
}

function focusFieldForSaveMessage(msg) {
    var text = String(msg || '').toLowerCase();
    if (!text) return;
    if (text.indexOf('description') >= 0) {
        var $desp = $('#txtPtDesp');
        $desp.focus();
        try {
            $desp[0].select();
        } catch (e) {}
        return;
    }
    if (text.indexOf('account group') >= 0) {
        focusAccountGroup();
        return;
    }
    if (text.indexOf('user or user group') >= 0 || text.indexOf('hierarchy') >= 0) {
        validateApprovalLevelsAndFocus();
        return;
    }
    if (text.indexOf('approval level') >= 0) {
        var $rows = $('#tblPtVerification tbody tr');
        if (!$rows.length) {
            var addBtn = document.getElementById('btnPtAddLevel');
            if (addBtn && addBtn.scrollIntoView) {
                addBtn.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
            $('#btnPtAddLevel').focus();
            return;
        }
        focusApprovalLevelField($rows.first(), '.pt-hierarchy');
    }
}

function validateApprovalLevelsAndFocus() {
    var invalid = null;
    $('#tblPtVerification tbody tr').each(function () {
        var $tr = $(this);
        var hierarchy = ($tr.find('.pt-hierarchy').val() || '').trim();
        if (!hierarchy) {
            invalid = { $tr: $tr, selector: '.pt-hierarchy', msg: 'Approval hierarchy is required on each level.' };
            return false;
        }
        var userCodes = joinMasterCodes($tr.find('.pt-users').val());
        var groupCodes = joinMasterCodes($tr.find('.pt-usergroups').val());
        if (!userCodes && !groupCodes) {
            invalid = {
                $tr: $tr,
                selector: '.pt-users',
                msg: 'Select at least one user or user group on each approval level.'
            };
            return false;
        }
    });
    if (invalid) {
        toastr.warning(invalid.msg);
        window.setTimeout(function () {
            focusApprovalLevelField(invalid.$tr, invalid.selector);
        }, 100);
        return false;
    }
    return true;
}

function collectPayload() {
    var transactions = [];
    $('#tblPtVerification tbody tr').each(function () {
        var $tr = $(this);
        var level = parseInt($tr.attr('data-level'), 10) || 0;
        var hierarchy = ($tr.find('.pt-hierarchy').val() || '').trim();
        if (!level && !hierarchy) return;
        transactions.push({
            Level: level,
            ApprovalHierarchy: hierarchy,
            UserMaster_Codes: joinMasterCodes($tr.find('.pt-users').val()),
            UserGroupMaster_Codes: joinMasterCodes($tr.find('.pt-usergroups').val())
        });
    });
    return {
        Code: parseInt($('#hfPtCode').val() || '0', 10) || 0,
        Desp: ($('#txtPtDesp').val() || '').trim(),
        IsActive: ($('#hfPtIsActive').val() || 'Y').toUpperCase() === 'N' ? 'N' : 'Y',
        AllowManual: $('#chkPtAllowManual').is(':checked') ? 'Y' : 'N',
        IsSalary: $('#chkPtIsSalary').is(':checked') ? 'Y' : 'N',
        AccountMaster_CodeAllowedGroup: parseInt($('#ddlPtAccountGroup').val() || '0', 10) || 0,
        Transactions: transactions
    };
}

function savePayType() {
    var currentCode = parseInt($('#hfPtCode').val() || '0', 10) || 0;
    checkRight(currentCode > 0 ? 'Edit' : 'New').then(function (allowed) {
        if (!allowed) return;
        var payload = collectPayload();
        if (!payload.Desp) {
            toastr.warning('Description is required.');
            $('#txtPtDesp').focus();
            return;
        }
        if (!payload.AccountMaster_CodeAllowedGroup) {
            toastr.warning('Account group is required.');
            focusAccountGroup();
            return;
        }
        if ($('#tblPtVerification tbody tr').length < PT_MIN_LEVELS) {
            var noLevelMsg = 'At least three approval levels are required.';
            toastr.warning(noLevelMsg);
            focusFieldForSaveMessage(noLevelMsg);
            return;
        }
        if (!validateApprovalLevelsAndFocus()) {
            return;
        }
        if (typeof window.Showloader === 'function') window.Showloader();
        PayTypeMasterService.Save(payload)
            .then(function (res) {
                if (res && (res.Status === 'Y' || res.status === 'Y')) {
                    toastr.success((res && (res.Msg || res.Message)) || 'Saved successfully.');
                    setTimeout(showListPanel, 600);
                } else {
                    var errMsg = (res && (res.Msg || res.Message || res.message)) || 'Save failed.';
                    toastr.error(errMsg);
                    focusFieldForSaveMessage(errMsg);
                }
            })
            .catch(function () { toastr.error('Save request failed.'); })
            .finally(function () {
                if (typeof window.HideLoader === 'function') window.HideLoader();
            });
    });
}

function buildActionHtml(code) {
    var html = '<div class="pm-actions">';
    if (ptHasViewRight) html += '<button type="button" class="pm-icon-btn view js-pt-view" title="View" data-code="' + code + '"><i class="fas fa-eye"></i></button>';
    if (ptHasEditRight) html += '<button type="button" class="pm-icon-btn edit js-pt-edit" title="Edit" data-code="' + code + '"><i class="fas fa-pencil-alt"></i></button>';
    if (ptHasDeleteRight) html += '<button type="button" class="pm-icon-btn del js-pt-delete" title="Mark inactive" data-code="' + code + '"><i class="fas fa-ban"></i></button>';
    if (ptHasNewRight) html += '<button type="button" class="pm-icon-btn copy js-pt-copy" title="Copy" data-code="' + code + '"><i class="fas fa-copy"></i></button>';
    return html + '</div>';
}

function mapRowForGrid(item, idx) {
    var code = Number(item.Code) || 0;
    return {
        Code: code,
        'S.No.': idx + 1,
        Description: item.Description != null ? String(item.Description) : '',
        'Account group': item.AccountGroup != null ? String(item.AccountGroup) : (item.accountGroup != null ? String(item.accountGroup) : ''),
        Manual: item.Manual != null ? String(item.Manual) : '',
        Salary: item.Salary != null ? String(item.Salary) : '',
        Active: item.Active != null ? String(item.Active) : '',
        Action: buildActionHtml(code)
    };
}

function applySearch(rows) {
    var q = ($('#ptSearch').val() || '').toLowerCase().trim();
    if (!q) return (rows || []).slice();
    return (rows || []).filter(function (r) {
        return (
            String(r.Description || '').toLowerCase().indexOf(q) >= 0 ||
            String(r.Manual || '').toLowerCase().indexOf(q) >= 0 ||
            String(r.Salary || '').toLowerCase().indexOf(q) >= 0 ||
            String(r.Active || '').toLowerCase().indexOf(q) >= 0 ||
            String(r.AccountGroup || '').toLowerCase().indexOf(q) >= 0
        );
    });
}

function bindGridData(filteredRows) {
    var rows = filteredRows || [];
    if (!rows.length) {
        $('#table-header-PayTypeMaster').empty();
        $('#table-body-PayTypeMaster').html(
            '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted);">No records found. Click <strong>New pay type</strong> to add.</td></tr>'
        );
        $('#paginator-PayTypeMaster').empty();
        return;
    }
    BizsolCustomFilterGrid.CreateDataTable(
        'table-header-PayTypeMaster',
        'table-body-PayTypeMaster',
        rows.map(mapRowForGrid),
        false,
        [],
        PT_GRID_STRING_FILTERS,
        [],
        [],
        [],
        ['Code'],
        {
            'S.No.': 'center;width:50px;min-width:40px;max-width:50px;white-space:nowrap;',
            'Account group': 'left;min-width:120px;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;',
            Manual: 'center;',
            Salary: 'center;',
            Active: 'center;',
            Action: 'center;min-width:128px;white-space:nowrap;'
        },
        true,
        null,
        null
    );
}

function loadLocateList() {
    if (typeof window.Showloader === 'function') window.Showloader();
    return PayTypeMasterService.GetPayTypeMasterLocate()
        .then(function (res) {
            G_PT_SourceRows = firstArray(res);
            bindGridData(applySearch(G_PT_SourceRows));
        })
        .catch(function () {
            G_PT_SourceRows = [];
            bindGridData([]);
            toastr.error('Error loading pay type list.');
        })
        .finally(function () {
            if (typeof window.HideLoader === 'function') window.HideLoader();
        });
}

function openView(code) {
    checkRight('View').then(function (ok) {
        if (!ok) return;
        loadLookups().then(function () {
            showDetailPanel('view');
            loadEditRecord(code, 'view');
        });
    });
}

function openCopy(code) {
    checkRight('New').then(function (ok) {
        if (!ok) return;
        loadLookups().then(function () {
            showDetailPanel('new');
            loadEditRecord(code, 'edit').then(function () {
                var desp = ($('#txtPtDesp').val() || '').trim();
                if (!desp) return;
                $('#hfPtCode').val('0');
                $('#hfPtIsActive').val('Y');
                $('#txtPtDesp').val((desp + ' - Copy').slice(0, 150)).focus().select();
            });
        });
    });
}

function openEdit(code) {
    checkRight('Edit').then(function (ok) {
        if (!ok) return;
        loadLookups().then(function () {
            showDetailPanel('edit');
            loadEditRecord(code, 'edit');
        });
    });
}

function openDelete(code) {
    checkRight('Delete').then(function (ok) {
        if (!ok) return;
        $('#hfPtDeleteCode').val(code);
        showModal('dvPtDeleteModal');
    });
}

function confirmDelete() {
    var code = parseInt($('#hfPtDeleteCode').val() || '0', 10) || 0;
    if (!code) {
        hideModal('dvPtDeleteModal');
        return;
    }
    if (typeof window.Showloader === 'function') window.Showloader();
        PayTypeMasterService.Delete(code)
        .then(function (res) {
            if (res && (res.Status === 'Y' || res.status === 'Y')) {
                hideModal('dvPtDeleteModal');
                toastr.success((res && res.Msg) || 'Marked inactive successfully.');
                loadLocateList();
            } else {
                toastr.error((res && (res.Msg || res.message)) || 'Could not mark inactive.');
            }
        })
        .catch(function (err) {
            var msg = (err && err.xhr && err.xhr.responseText) ? String(err.xhr.responseText).trim() : '';
            if (msg.length > 200) msg = msg.slice(0, 200);
            toastr.error(msg || 'Mark inactive request failed.');
        })
        .finally(function () {
            if (typeof window.HideLoader === 'function') window.HideLoader();
        });
}

function resolveModuleRights() {
    var finYear = getFinancialYear();
    var moduleName = getPtModuleName();
    return Promise.all([
        MenuService.CheckModuleOptionRight(moduleName, 'New', 'N', finYear),
        MenuService.CheckModuleOptionRight(moduleName, 'Edit', 'N', finYear),
        MenuService.CheckModuleOptionRight(moduleName, 'View', 'N', finYear),
        MenuService.CheckModuleOptionRight(moduleName, 'Delete', 'N', finYear)
    ]).then(function (results) {
        ptHasNewRight = !!(results[0] && results[0].CheckModuleOptionRight === 'Y');
        ptHasEditRight = !!(results[1] && results[1].CheckModuleOptionRight === 'Y');
        ptHasViewRight = !!(results[2] && results[2].CheckModuleOptionRight === 'Y');
        ptHasDeleteRight = !!(results[3] && results[3].CheckModuleOptionRight === 'Y');
        $('#btnCreatePaymentType').toggle(!!ptHasNewRight);
    }).catch(function () {
        ptHasNewRight = ptHasEditRight = ptHasViewRight = ptHasDeleteRight = false;
        $('#btnCreatePaymentType').hide();
    });
}

function initPayTypeMasterPage() {
    var searchTimer;
    $('#PayTypeMasterPage')
        .on('click', '#btnCreatePaymentType', function () {
            checkRight('New').then(function (ok) {
                if (!ok) return;
                loadLookups(true).then(function () {
                    showDetailPanel('new');
                    clearForm();
                    $('#txtPtDesp').focus();
                });
            });
        })
        .on('click', '#btnBackToList', showListPanel)
        .on('click', '#btnClearPt', clearForm)
        .on('click', '#btnSavePt', savePayType)
        .on('click', '#btnPtAddLevel', function () { addVerificationLevel(); })
        .on('click', '#table-body-PayTypeMaster .js-pt-view', function () {
            openView(parseInt($(this).data('code') || '0', 10) || 0);
        })
        .on('click', '#table-body-PayTypeMaster .js-pt-edit', function () {
            openEdit(parseInt($(this).data('code') || '0', 10) || 0);
        })
        .on('click', '#table-body-PayTypeMaster .js-pt-copy', function () {
            openCopy(parseInt($(this).data('code') || '0', 10) || 0);
        })
        .on('click', '#table-body-PayTypeMaster .js-pt-delete', function () {
            openDelete(parseInt($(this).data('code') || '0', 10) || 0);
        })
        .on('click', '#tblPtVerification .pt-remove-level', function () {
            if (G_PT_DetailMode === 'view') return;
            var $row = $(this).closest('tr');
            var level = parseInt($row.attr('data-level'), 10) || 0;
            if (level <= PT_MIN_LEVELS) return;
            if ($('#tblPtVerification tbody tr').length <= PT_MIN_LEVELS) return;
            $row.find('.pt-users, .pt-usergroups').each(function () { destroySelect2($(this)); });
            $row.remove();
            syncRemoveLevelButtons();
            syncPayTypeTabOrder();
        })
        .on('input', '#ptSearch', function () {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function () {
                bindGridData(applySearch(G_PT_SourceRows));
            }, 200);
        })
        .on('keydown', '#ptSearch', function (e) {
            if (e.key === 'Escape') {
                $(this).val('');
                bindGridData(applySearch(G_PT_SourceRows));
            }
        });

    $('#btnPtConfirmDelete').on('click', confirmDelete);
    $('#btnSavePt').on('keydown', function (e) {
        if (e.key !== 'Tab' || e.shiftKey) return;
        e.preventDefault();
        $('#txtPtDesp').focus();
    });
    resolveModuleRights().finally(loadLocateList);
}

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    if (!$('#ERPHeading').text().trim()) {
        $('#ERPHeading').text('Pay Type Master');
    }
    initPayTypeMasterPage();
});
