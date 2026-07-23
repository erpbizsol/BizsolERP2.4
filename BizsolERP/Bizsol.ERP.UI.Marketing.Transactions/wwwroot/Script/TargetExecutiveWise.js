import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { TargetExecutiveWiseService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/TargetExecutiveWiseService.js';

const MODULE_NAME = 'Target (Executive Wise)';
/* FY display order (Apr–Mar); MonthNumber = calendar month (Jan=1 … Dec=12) */
const MONTHS = [
    { Name: 'April', Number: 4 },
    { Name: 'May', Number: 5 },
    { Name: 'June', Number: 6 },
    { Name: 'July', Number: 7 },
    { Name: 'August', Number: 8 },
    { Name: 'September', Number: 9 },
    { Name: 'October', Number: 10 },
    { Name: 'November', Number: 11 },
    { Name: 'December', Number: 12 },
    { Name: 'January', Number: 1 },
    { Name: 'February', Number: 2 },
    { Name: 'March', Number: 3 }
];

let G_TargetList = [];
let G_MarketingManList = [];

function showPageLoader() {
    if (typeof window.Showloader === 'function') {
        window.Showloader();
    }
}

function hidePageLoader() {
    if (typeof window.HideLoader === 'function') {
        window.HideLoader();
    }
}

function firstPayloadArray(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.Data)) return payload.Data;
    return [];
}

function getFinancialYear() {
    if (BizSolHelperFunction && typeof BizSolHelperFunction.getFinancialYear === 'function') {
        return BizSolHelperFunction.getFinancialYear();
    }
    const currentDate = new Date();
    let startYear = currentDate.getFullYear();
    if (currentDate.getMonth() < 3) startYear = startYear - 1;
    return startYear + '-' + (startYear + 1);
}

function getUserMasterCode() {
    try {
        const authKey = JSON.parse(sessionStorage.getItem('authKey'));
        return authKey ? authKey.UserMaster_Code : 0;
    } catch (e) {
        return 0;
    }
}

function BindSelectList(element, list, firstItem) {
    if (!element) return;
    let option = '';
    if (firstItem === 'FirstItemAll') {
        option = '<option value="0">All</option>';
    } else if (firstItem === 'FirstItemSelected') {
        option = '<option value="">-- Select --</option>';
    } else {
        option = '<option value="">-- Select --</option>';
    }
    $.each(list || [], function (_key, val) {
        if (!val || val.Code === undefined || val.Code === null) return;
        option += '<option value="' + val.Code + '">' + (val.Desp || '') + '</option>';
    });
    element.innerHTML = option;
}

function initSelect2($el, dropdownParent) {
    if (!$el || !$el.length || typeof $el.select2 !== 'function') return;
    try {
        if ($el.hasClass('select2-hidden-accessible')) {
            $el.select2('destroy');
        }
    } catch (e) { }

    const $parent = dropdownParent && dropdownParent.length
        ? dropdownParent
        : ($el.closest('.modal').length ? $el.closest('.modal') : $(document.body));

    $el.select2({
        width: '100%',
        dropdownParent: $parent,
        placeholder: $el.find('option[value=""]').text() || '-- Select --',
        allowClear: true,
        matcher: function (params, data) {
            if ($.trim(params.term) === '') return data;
            if (!data.id || data.id === '') return null;
            if (data.text && data.text.toLowerCase().indexOf(params.term.toLowerCase()) > -1) {
                return data;
            }
            return null;
        }
    });
}

async function bindModalMarketingMan(selectedCode) {
    const $ddl = $('#ddlModalMarketingMan');
    if (!$ddl.length) return;

    if (!G_MarketingManList || G_MarketingManList.length === 0) {
        await loadMarketingManDropdowns();
    }

    if (!G_MarketingManList || G_MarketingManList.length === 0) {
        return;
    }

    BindSelectList($ddl[0], G_MarketingManList, 'FirstItemSelected');
    initSelect2($ddl, $('#dvTargetModal'));
    if (selectedCode) {
        $ddl.val(String(selectedCode)).trigger('change');
    } else {
        $ddl.val('').trigger('change');
    }
}

function bindFinYearDropdowns() {
    const current = getFinancialYear();
    const startYear = parseInt(String(current).split('-')[0], 10) || new Date().getFullYear();
    const years = [];
    for (let i = startYear - 2; i <= startYear + 1; i++) {
        years.push(i + '-' + (i + 1));
    }

    ['#ddlFinYear', '#ddlModalFinYear'].forEach(function (sel) {
        const $ddl = $(sel);
        $ddl.empty();
        years.forEach(function (fy) {
            $ddl.append($('<option></option>').attr('value', fy).text(fy));
        });
        $ddl.val(current);
    });
}

function bindMonthDropdowns() {
    const $filter = $('#ddlMonth');
    const $modal = $('#ddlModalMonth');
    $filter.empty().append('<option value="0">All</option>');
    $modal.empty().append('<option value="">-- Select Month --</option>');
    MONTHS.forEach(function (m) {
        $filter.append($('<option></option>').attr('value', m.Number).text(m.Name));
        $modal.append($('<option></option>').attr('value', m.Number).attr('data-month-name', m.Name).text(m.Name));
    });
}

function getMonthNameByNumber(monthNumber) {
    const n = parseInt(monthNumber, 10) || 0;
    const found = MONTHS.find(function (m) { return m.Number === n; });
    return found ? found.Name : '';
}

async function loadMarketingManDropdowns(useLoader = true) {
    if (useLoader) showPageLoader();
    try {
        const response = await TargetExecutiveWiseService.GetNestedMarketingManList();
        const rows = firstPayloadArray(response);
        const userMaster_Code = getUserMasterCode();
        let matchedCode = null;

        G_MarketingManList = rows
            .filter(function (item) {
                return item && (item.PersonName || item.Desp) && item.Code != null;
            })
            .map(function (item) {
                const userCode = item.Usermaster_Code ?? item.UserMaster_Code;
                if (userMaster_Code && userCode == userMaster_Code) {
                    matchedCode = item.Code;
                }
                return {
                    Code: item.Code,
                    Desp: item.PersonName || item.Desp || ('Code ' + item.Code)
                };
            });

        // Bind only when API returned data
        if (!G_MarketingManList.length) {
            return;
        }

        BindSelectList($('#ddlMarketingMan')[0], G_MarketingManList, 'FirstItemAll');
        initSelect2($('#ddlMarketingMan'));

        BindSelectList($('#ddlModalMarketingMan')[0], G_MarketingManList, 'FirstItemSelected');
        initSelect2($('#ddlModalMarketingMan'), $('#dvTargetModal'));

        if (matchedCode != null && matchedCode !== '') {
            $('#ddlMarketingMan').val(String(matchedCode)).trigger('change');
        }
    } catch (err) {
        G_MarketingManList = [];
        console.error('GetNestedMarketingManList failed:', err);
    } finally {
        if (useLoader) hidePageLoader();
    }
}

function onlyIntInput($el) {
    $el.on('input', function () {
        let v = String(this.value || '').replace(/[^\d]/g, '');
        if (v !== this.value) this.value = v;
    });
    $el.on('keypress', function (e) {
        const ch = String.fromCharCode(e.which || e.keyCode);
        if (!/[0-9]/.test(ch)) {
            e.preventDefault();
            return false;
        }
    });
}

$(document).ready(async function () {
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');

    bindFinYearDropdowns();
    bindMonthDropdowns();
    onlyIntInput($('#txtDreamClientTarget'));
    onlyIntInput($('#txtLeadsTarget'));

    showPageLoader();
    try {
        await loadMarketingManDropdowns(false);
        await loadTargets(false);
    } finally {
        hidePageLoader();
    }

    $('#btnShow').on('click', function () {
        loadTargets();
    });

    $('#btnCreateTarget').on('click', function () {
        OpenNew_Target();
    });

    $('#btnSaveTarget').on('click', function () {
        saveTarget();
    });

    $('#btnConfirmDelete').on('click', function () {
        const code = parseInt($('#hfDeleteCode').val() || '0', 10) || 0;
        const reason = ($('#reasonForDeleteInput').val() || '').trim();
        if (!reason) {
            toastr.warning('Please provide a reason for deletion.');
            $('#reasonForDeleteInput').focus();
            return;
        }
        if (code > 0) callDeleteApi(code, reason);
    });

    $('#pmSearch').on('input', function () {
        applySearchFilter();
    });
});

async function OpenNew_Target() {
    const response = await MenuService.CheckModuleOptionRight(MODULE_NAME, 'New', 'Y', getFinancialYear());
    if (response.CheckModuleOptionRight == 'N') {
        toastr.error(response.Msg);
        return;
    }
    resetForm();
    $('#target-modal-title').text('New Target');
    $('#ddlModalFinYear').val($('#ddlFinYear').val() || getFinancialYear());
    const filterMonth = parseInt($('#ddlMonth').val() || '0', 10) || 0;
    if (filterMonth > 0) $('#ddlModalMonth').val(String(filterMonth));

    const filterMm = $('#ddlMarketingMan').val();
    const selectedMm = (filterMm && filterMm !== '0') ? filterMm : '';
    await bindModalMarketingMan(selectedMm);
    showModal('dvTargetModal');
}

async function Target_EditData(code) {
    const response = await MenuService.CheckModuleOptionRight(MODULE_NAME, 'Edit', 'Y', getFinancialYear());
    if (response.CheckModuleOptionRight == 'N') {
        toastr.error(response.Msg);
        return;
    }

    showPageLoader();
    try {
        const apiResponse = await TargetExecutiveWiseService.Locate(0, '', 0, code);
        const rows = firstPayloadArray(apiResponse);
        const row = rows[0] || (G_TargetList || []).find(function (x) { return String(x.Code) === String(code); });
        if (!row) {
            toastr.warning('Record not found.');
            return;
        }
        resetForm();
        $('#hfTargetCode').val(row.Code);
        $('#ddlModalFinYear').val(row.FinYear || getFinancialYear());
        $('#ddlModalMonth').val(String(row.MonthNumber || ''));
        $('#txtDreamClientTarget').val(row.DreamClientTarget != null ? row.DreamClientTarget : 0);
        $('#txtLeadsTarget').val(row.LeadsTarget != null ? row.LeadsTarget : 0);
        $('#target-modal-title').text('Edit Target');
        await bindModalMarketingMan(row.MarketingManMaster_Code);
        showModal('dvTargetModal');
    } catch (e) {
        toastr.error('Failed to load record.');
    } finally {
        hidePageLoader();
    }
}

async function viewTarget(code) {
    showPageLoader();
    try {
        const apiResponse = await TargetExecutiveWiseService.Locate(0, '', 0, code);
        const rows = firstPayloadArray(apiResponse);
        const row = rows[0] || (G_TargetList || []).find(function (x) { return String(x.Code) === String(code); });
        if (!row) {
            toastr.warning('Record not found.');
            return;
        }
        $('#viewMarketingMan').text(row.MarketingManName || '—');
        $('#viewFinYear').text(row.FinYear || '—');
        $('#viewMonth').text(row.MonthName || getMonthNameByNumber(row.MonthNumber) || '—');
        $('#viewDreamClientTarget').text(row.DreamClientTarget != null ? row.DreamClientTarget : '—');
        $('#viewLeadsTarget').text(row.LeadsTarget != null ? row.LeadsTarget : '—');
        showModal('dvTargetViewModal');
    } catch (e) {
        toastr.error('Failed to load record.');
    } finally {
        hidePageLoader();
    }
}

async function DeleteTarget(code) {
    if (!code) return;
    const response = await MenuService.CheckModuleOptionRight(MODULE_NAME, 'Delete', 'Y', getFinancialYear());
    if (response.CheckModuleOptionRight == 'N') {
        toastr.error(response.Msg);
        return;
    }
    $('#hfDeleteCode').val(code);
    $('#reasonForDeleteInput').val('');
    showModal('dvDeleteConfirmModal');
}

async function callDeleteApi(code, reason) {
    showPageLoader();
    try {
        const response = await TargetExecutiveWiseService.Delete(code, reason);
        if (response.Status === 'Y') {
            toastr.success(response.Msg || 'Target deleted successfully.');
            hideModal('dvDeleteConfirmModal');
            await loadTargets(false);
        } else {
            toastr.warning(response.Msg);
        }
    } catch (error) {
        toastr.error((error && error.Msg) || 'Delete failed.');
    } finally {
        hidePageLoader();
    }
}

function resetForm() {
    $('#hfTargetCode').val(0);
    $('#ddlModalFinYear').val(getFinancialYear());
    $('#ddlModalMonth').val('');
    $('#txtDreamClientTarget').val('');
    $('#txtLeadsTarget').val('');
}

function parseIntStrict(val) {
    if (val === null || val === undefined || String(val).trim() === '') return null;
    if (!/^\d+$/.test(String(val).trim())) return null;
    return parseInt(String(val).trim(), 10);
}

function validateForm() {
    const mm = ($('#ddlModalMarketingMan').val() || '').trim();
    const fy = ($('#ddlModalFinYear').val() || '').trim();
    const monthNumber = parseInt($('#ddlModalMonth').val() || '0', 10) || 0;
    const dream = parseIntStrict($('#txtDreamClientTarget').val());
    const leads = parseIntStrict($('#txtLeadsTarget').val());

    if (!mm || mm === '0') {
        toastr.warning('Please select Marketing Man.');
        $('#ddlModalMarketingMan').focus();
        return false;
    }
    if (!fy) {
        toastr.warning('Please select Fin Year.');
        $('#ddlModalFinYear').focus();
        return false;
    }
    if (monthNumber < 1 || monthNumber > 12) {
        toastr.warning('Please select Month.');
        $('#ddlModalMonth').focus();
        return false;
    }
    if (dream === null) {
        toastr.warning('Dream Client Target must be a whole number (integer).');
        $('#txtDreamClientTarget').focus();
        return false;
    }
    if (leads === null) {
        toastr.warning('Leads Target must be a whole number (integer).');
        $('#txtLeadsTarget').focus();
        return false;
    }
    return true;
}

async function saveTarget() {
    if (!validateForm()) return;

    const code = parseInt($('#hfTargetCode').val() || '0', 10) || 0;
    const optionName = code > 0 ? 'Edit' : 'New';

    const response = await MenuService.CheckModuleOptionRight(MODULE_NAME, optionName, 'Y', getFinancialYear());
    if (response.CheckModuleOptionRight == 'N') {
        toastr.error(response.Msg);
        return;
    }
    await callSaveApi(code);
}

async function callSaveApi(code) {
    const monthNumber = parseInt($('#ddlModalMonth').val() || '0', 10) || 0;
    const payload = {
        Code: code,
        MarketingManMaster_Code: parseInt($('#ddlModalMarketingMan').val() || '0', 10) || 0,
        FinYear: ($('#ddlModalFinYear').val() || '').trim(),
        MonthName: getMonthNameByNumber(monthNumber),
        MonthNumber: monthNumber,
        DreamClientTarget: parseIntStrict($('#txtDreamClientTarget').val()) || 0,
        LeadsTarget: parseIntStrict($('#txtLeadsTarget').val()) || 0,
        UserMaster_Code: getUserMasterCode()
    };

    showPageLoader();
    try {
        const response = code > 0
            ? await TargetExecutiveWiseService.Edit(payload)
            : await TargetExecutiveWiseService.Save(payload);

        if (response.Status === 'Y') {
            toastr.success(response.Message || response.Msg || 'Target saved successfully.');
            hideModal('dvTargetModal');
            await loadTargets(false);
        } else {
            toastr.warning(response.Message || response.Msg);
        }
    } catch (error) {
        toastr.error((error && (error.Msg || error.Message)) || 'Save failed.');
    } finally {
        hidePageLoader();
    }
}

async function loadTargets(useLoader = true) {
    const mm = parseInt($('#ddlMarketingMan').val() || '0', 10) || 0;
    const fy = ($('#ddlFinYear').val() || '').trim();
    const monthNumber = parseInt($('#ddlMonth').val() || '0', 10) || 0;

    if (!fy) {
        toastr.warning('Please select Fin Year.');
        return;
    }

    if (useLoader) showPageLoader();
    try {
        const response = await TargetExecutiveWiseService.Locate(mm, fy, monthNumber, 0);
        G_TargetList = firstPayloadArray(response);
        updateStats(G_TargetList);
        applySearchFilter();
    } catch (error) {
        G_TargetList = [];
        updateStats([]);
        applySearchFilter();
        toastr.error((error && error.Msg) || 'Failed to load targets.');
    } finally {
        if (useLoader) hidePageLoader();
    }
}

function updateStats(list) {
    let dream = 0;
    let leads = 0;
    (list || []).forEach(function (x) {
        dream += parseInt(x.DreamClientTarget || 0, 10) || 0;
        leads += parseInt(x.LeadsTarget || 0, 10) || 0;
    });
    $('#statTotal').text((list || []).length);
    $('#statDreamClient').text(dream);
    $('#statLeads').text(leads);
}

function applySearchFilter() {
    const query = ($('#pmSearch').val() || '').toLowerCase().trim();
    let list = G_TargetList || [];
    if (query) {
        list = list.filter(function (item) {
            const name = (item.MarketingManName || '').toLowerCase();
            const month = (item.MonthName || '').toLowerCase();
            const fy = (item.FinYear || '').toLowerCase();
            return name.includes(query) || month.includes(query) || fy.includes(query);
        });
    }
    bindGrid(list);
}

function bindGrid(list) {
    const $tbody = $('#tblTarget tbody');
    $tbody.empty();

    if (!list || list.length === 0) {
        $tbody.append(`
            <tr>
                <td colspan="7">
                    <div class="pm-empty">
                        <div class="pm-empty-icon"><i class="fas fa-bullseye"></i></div>
                        <div class="pm-empty-title">No Targets Found</div>
                        <div class="pm-empty-sub">Click "New Target" to create your first executive target.</div>
                    </div>
                </td>
            </tr>`);
        return;
    }

    list.forEach(function (item, index) {
        const code = item.Code || 0;
        $tbody.append(`
            <tr>
                <td class="center"><span class="pm-sno">${index + 1}</span></td>
                <td>${escHtml(item.MarketingManName || '')}</td>
                <td class="center"><span class="pm-code-badge">${escHtml(item.FinYear || '')}</span></td>
                <td class="center">${escHtml(item.MonthName || getMonthNameByNumber(item.MonthNumber) || '')}</td>
                <td class="right"><span class="pm-days-chip">${parseInt(item.DreamClientTarget || 0, 10) || 0}</span></td>
                <td class="right"><span class="pm-days-chip">${parseInt(item.LeadsTarget || 0, 10) || 0}</span></td>
                <td class="center">
                    <div class="pm-actions">
                        <button type="button" class="pm-icon-btn view" title="View" onclick="viewTarget(${code})"><i class="fas fa-eye"></i></button>
                        <button type="button" class="pm-icon-btn edit" title="Edit" onclick="Target_EditData(${code})"><i class="fas fa-pencil-alt"></i></button>
                        <button type="button" class="pm-icon-btn del" title="Delete" onclick="DeleteTarget(${code})"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </td>
            </tr>`);
    });
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
            const m = bootstrap.Modal.getInstance(el);
            if (m) m.hide();
        } else {
            $('#' + id).modal('hide');
        }
    } catch (e) {
        $('#' + id).modal('hide');
    }
}

window.viewTarget = viewTarget;
window.Target_EditData = Target_EditData;
window.DeleteTarget = DeleteTarget;
