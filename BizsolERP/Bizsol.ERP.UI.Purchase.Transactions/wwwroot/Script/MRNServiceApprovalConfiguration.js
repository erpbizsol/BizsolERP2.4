import { MRNMasterApprovalConfigService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MRNMasterApprovalConfigService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';

function unwrapRowArray(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.Data)) return raw.Data;
    if (Array.isArray(raw.data)) return raw.data;
    return [];
}

let G_LevelList = [];
let G_GroupList = [];
let G_EditMode = 'New';

BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');

function CheckRight(optionName) {
    const ModuleName = $('#ERPHeading').text().trim();
    const FinYear = BizSolHelperFunction.getFinancialYear();
    return MenuService.CheckModuleOptionRight(ModuleName, optionName, 'Y', FinYear);
}

$(document).ready(function () {
    InitPage();
});

async function InitPage() {
    Showloader();
    try {
        await Promise.all([LoadGroupList(), LoadLevelList()]);
    } finally {
        HideLoader();
    }
}

function normalizeGroupRow(g) {
    if (!g || typeof g !== 'object') return null;
    const code = g.Code ?? g.code ?? g.GroupMaster_Code ?? g.groupMaster_Code;
    const name = g.GroupName ?? g.groupName ?? g.Description ?? g.Name ?? g.GroupDesp ?? '';
    if (code == null || code === '') return null;
    return { Code: code, GroupName: String(name).trim() };
}

function normalizeToGroupArray(raw) {
    if (!raw) return [];
    let arr = raw;
    if (!Array.isArray(arr)) {
        if (Array.isArray(raw.Data)) arr = raw.Data;
        else if (Array.isArray(raw.data)) arr = raw.data;
        else return [];
    }
    const out = [];
    for (let i = 0; i < arr.length; i++) {
        const row = normalizeGroupRow(arr[i]);
        if (row) out.push(row);
    }
    return out;
}

async function LoadGroupList() {
    let list = [];
    try {
        const pay = await MRNMasterApprovalConfigService.GetApproverGroupList();
        list = normalizeToGroupArray(pay);
    } catch (e) {
        /* toastr from promiseAjaxCallApi */
    }
    G_GroupList = list;
    if (!list.length && typeof console !== 'undefined' && console.warn) {
        console.warn(
            'GRN Service (MRN) approval config: no approver groups loaded. ' +
            'Check GRNPaymentApprovalConfiguration GetGRNPaymentddl Mode=DDL_APPROVERGROUP.'
        );
    }
    PopulateGroupSelect();
}

function PopulateGroupSelect() {
    const sel = document.getElementById('frmGroup');
    sel.innerHTML = '<option value=""></option>';
    G_GroupList.forEach(function (g) {
        const opt = document.createElement('option');
        opt.value = String(g.Code);
        opt.textContent = g.GroupName || String(g.Code);
        sel.appendChild(opt);
    });
    MRNMasterApprovalConfigService.MergeSessionGroupIntoSelect(sel);
    InitSelect2();
}

function InitSelect2() {
    try {
        const $el = $('#frmGroup');
        if ($el.data('select2')) {
            $el.select2('destroy');
        }
        $el.select2({
            placeholder: 'Search and select group...',
            allowClear: false,
            width: '100%'
        });
    } catch (e) { /* Select2 unavailable */ }
}

function isYnYes(val) {
    const s = String(val ?? '').trim().toUpperCase();
    return s === 'Y' || s === '1' || s === 'TRUE';
}

function pickIsLevelApplicable(item) {
    if (!item) return 'N';
    const raw = item.IsLevelApplicable != null ? item.IsLevelApplicable : item.isLevelApplicable;
    return isYnYes(raw) ? 'Y' : 'N';
}

function setApplicableCheckbox(val, locked) {
    const chk = document.getElementById('frmApplicable');
    if (!chk) return;
    const forceY = !!locked;
    chk.checked = forceY ? true : isYnYes(val);
    chk.disabled = forceY;
    chk.title = forceY ? 'First and last levels must always be applicable.' : '';
}

function isAnchorLevelIndex(idx, count) {
    return count <= 1 || idx === 0 || idx === count - 1;
}

function isAnchorLevelPosition(levelNum, code) {
    const count = G_LevelList.length;
    if (count === 0 || G_EditMode === 'New') return true;

    const idx = G_LevelList.findIndex(function (l) { return String(l.Code) === String(code); });
    if (idx >= 0) return isAnchorLevelIndex(idx, count);

    const levels = G_LevelList.map(function (l) { return l.Level; });
    const minLevel = Math.min.apply(null, levels);
    const maxLevel = Math.max.apply(null, levels);
    return levelNum === minLevel || levelNum === maxLevel;
}

function getIsLevelApplicableForSave(levelNum, code) {
    if (isAnchorLevelPosition(levelNum, code)) return 'Y';
    const chk = document.getElementById('frmApplicable');
    return (chk && chk.checked) ? 'Y' : 'N';
}

function renderApplicableBadge(val) {
    return isYnYes(val)
        ? '<span style="color:#059669;font-weight:700;font-size:0.76rem;">Yes</span>'
        : '<span style="color:#94a3b8;font-weight:600;font-size:0.76rem;">No</span>';
}

async function LoadLevelList() {
    try {
        const result = await MRNMasterApprovalConfigService.GetLevelList();
        G_LevelList = unwrapRowArray(result);
    } catch (e) {
        G_LevelList = [];
    }
    RenderTable();
}

function RenderTable() {
    const tbody = document.getElementById('tblLevelsBody');
    const badge = document.getElementById('levelCountBadge');
    const statCount = document.getElementById('statLevelCount');
    const count = G_LevelList.length;

    badge.textContent = count + ' Level' + (count !== 1 ? 's' : '');
    statCount.textContent = count;

    if (count === 0) {
        tbody.innerHTML =
            '<tr><td colspan="6" class="empty-levels">' +
            '<i class="fa fa-layer-group"></i>' +
            'No approval levels configured yet.<br>' +
            'Click <strong>Add Level</strong> to get started.' +
            '</td></tr>';
        return;
    }

    const lastCode = G_LevelList[count - 1].Code;

    tbody.innerHTML = G_LevelList.map(function (item, idx) {
        const isLast = item.Code === lastCode;

        const groups = item.GroupName
            ? '<span class="group-tag">' + EscapeHtml(item.GroupName.trim()) + '</span>'
            : '<span style="color:#94a3b8;font-size:0.75rem;">—</span>';

        const applicable = renderApplicableBadge(
            isAnchorLevelIndex(idx, count) ? 'Y' : pickIsLevelApplicable(item)
        );

        const delBtn = isLast
            ? '<button type="button" class="btn-del-level ms-1"' +
              ' onclick="OpenDeleteModal(' + item.Code + ',\'' + EscapeAttr(item.LevelDesp) + '\')"' +
              ' title="Delete last level"><i class="fa fa-trash"></i></button>'
            : '';

        return '<tr>' +
            '<td style="text-align:center;color:#94a3b8;font-size:0.75rem;">' + (idx + 1) + '</td>' +
            '<td style="text-align:center;"><span class="level-badge">' + item.Level + '</span></td>' +
            '<td style="font-weight:600;">' + EscapeHtml(item.LevelDesp) + '</td>' +
            '<td>' + groups + '</td>' +
            '<td style="text-align:center;">' + applicable + '</td>' +
            '<td style="text-align:center;white-space:nowrap;">' +
                '<button type="button" class="btn-edit-level"' +
                ' onclick="OpenEditForm(' + item.Code + ')" title="Edit level">' +
                '<i class="fa fa-edit"></i></button>' +
                delBtn +
            '</td>' +
        '</tr>';
    }).join('');
}

function OpenAddForm() {
    CheckRight('New').then(function () {
        G_EditMode = 'New';

        const nextLevel = G_LevelList.length > 0
            ? Math.max.apply(null, G_LevelList.map(function (l) { return l.Level; })) + 1
            : 1;

        document.getElementById('frmCode').value = '0';
        document.getElementById('frmLevel').value = nextLevel;
        document.getElementById('frmLevelDesc').value = '';

        MRNMasterApprovalConfigService.ApplyDefaultGroupForNewLevel('frmGroup');
        try {
            $('#frmGroup').trigger('change');
        } catch (e) { }
        setApplicableCheckbox('Y', true);

        document.getElementById('formTitle').textContent = 'Add New Level';
        HideInfoBar();
        ShowForm();
    });
}

async function OpenEditForm(code) {
    const respCheck = await CheckRight('Edit');
    if (respCheck.CheckModuleOptionRight === 'N') {
        toastr.error(respCheck.Msg);
        return;
    }

    G_EditMode = 'Edit';
    Showloader();
    try {
        const result = await MRNMasterApprovalConfigService.GetLevelById(code);
        const rows = unwrapRowArray(result);
        const item = rows[0] || (result && typeof result === 'object' && !Array.isArray(result) && result.Code != null ? result : null);
        if (!item) {
            toastr.error('Could not load level data. Please try again.');
            return;
        }

        document.getElementById('frmCode').value = item.Code;
        document.getElementById('frmLevel').value = item.Level;
        document.getElementById('frmLevelDesc').value = item.LevelDesp || '';

        try {
            const gCode = item.GroupMaster_Code ?? item.groupMaster_Code ?? item.Group_Code;
            const matched = G_GroupList.find(function (g) {
                return String(g.Code) === String(gCode || '')
                    || (item.GroupName && g.GroupName === item.GroupName)
                    || (item.groupName && g.GroupName === item.groupName);
            });
            const groupCode = matched ? String(matched.Code) : '';
            $('#frmGroup').val(groupCode).trigger('change');
        } catch (e) { }

        setApplicableCheckbox(
            pickIsLevelApplicable(item),
            isAnchorLevelPosition(item.Level, item.Code)
        );

        document.getElementById('formTitle').textContent =
            'Edit Level ' + item.Level + ' — ' + (item.LevelDesp || '');
        HideInfoBar();
        ShowForm();
    } catch (e) {
        /* toastr already from promiseAjaxCallApi on HTTP error */
    } finally {
        HideLoader();
    }
}

function ShowForm() {
    const form = document.getElementById('divLevelForm');
    form.style.display = 'block';
    setTimeout(function () {
        form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
}

function CancelForm() {
    document.getElementById('divLevelForm').style.display = 'none';
    HideInfoBar();
}

function ShowInfoBar(msg) {
    document.getElementById('formInfoMsg').textContent = msg;
    document.getElementById('formInfoBar').style.display = 'block';
}

function HideInfoBar() {
    document.getElementById('formInfoBar').style.display = 'none';
}

async function SaveLevel() {
    const code = parseInt(document.getElementById('frmCode').value) || 0;
    const level = parseInt(document.getElementById('frmLevel').value) || 0;
    const levelDesc = document.getElementById('frmLevelDesc').value.trim();

    let groupCode = '0';
    try { groupCode = $('#frmGroup').val() || '0'; } catch (e) { }

    if (!levelDesc) {
        ShowInfoBar('Level Description is required.');
        document.getElementById('frmLevelDesc').focus();
        return;
    }
    if (!groupCode || groupCode === '0') {
        ShowInfoBar('Group is mandatory.');
        try {
            $('#frmGroup').select2('open');
        } catch (e) {
            const g = document.getElementById('frmGroup');
            if (g) g.focus();
        }
        return;
    }

    HideInfoBar();

    const payload = {
        Code: code,
        Level: level,
        LevelDesp: levelDesc,
        GroupMaster_Code: groupCode,
        IsLevelApplicable: getIsLevelApplicableForSave(level, code)
    };

    Showloader();
    try {
        const result = await MRNMasterApprovalConfigService.SaveConfig(payload);
        if (result && result.Status === 'Y') {
            MRNMasterApprovalConfigService.RememberLastApproverGroup(groupCode);
            toastr.success(result.Msg || 'Approval level saved successfully.');
            CancelForm();
            await LoadLevelList();
        } else {
            toastr.error(result && result.Msg ? result.Msg : 'Failed to save approval level.');
        }
    } catch (e) {
        /* toastr already from promiseAjaxCallApi on HTTP error (e.g. 404 — API route missing) */
    } finally {
        HideLoader();
    }
}

function OpenDeleteModal(code, levelDesc) {
    if (G_LevelList.length === 0) return;

    const lastItem = G_LevelList[G_LevelList.length - 1];
    if (lastItem.Code != code) {
        toastr.warning('Only the last level can be deleted. You cannot delete levels in between.');
        return;
    }

    document.getElementById('deleteCode').value = code;

    const reasonEl = document.getElementById('txtDeleteReason');
    const reasonErrEl = document.getElementById('deleteReasonError');
    if (reasonEl) reasonEl.value = '';
    if (reasonErrEl) reasonErrEl.style.display = 'none';

    document.getElementById('deleteConfirmMsg').innerHTML =
        'Are you sure you want to delete level <strong>&ldquo;' + EscapeHtml(levelDesc) + '&rdquo;</strong>?' +
        '<br><small style="color:#94a3b8;margin-top:4px;display:block;">This action cannot be undone.</small>';

    const modal = new bootstrap.Modal(document.getElementById('modalDeleteLevel'));
    modal.show();
    document.getElementById('modalDeleteLevel').addEventListener('shown.bs.modal', function focusReason() {
        const el = document.getElementById('txtDeleteReason');
        if (el) el.focus();
        document.getElementById('modalDeleteLevel').removeEventListener('shown.bs.modal', focusReason);
    });
}

async function ConfirmDeleteLevel() {
    const code = parseInt(document.getElementById('deleteCode').value) || 0;
    const reasonEl = document.getElementById('txtDeleteReason');
    const errEl = document.getElementById('deleteReasonError');
    const reason = reasonEl ? reasonEl.value.trim() : '';
    if (code === 0) return;

    if (!reason) {
        if (errEl) errEl.style.display = 'block';
        if (reasonEl) reasonEl.focus();
        return;
    }
    if (errEl) errEl.style.display = 'none';

    const modalEl = document.getElementById('modalDeleteLevel');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    Showloader();
    try {
        const result = await MRNMasterApprovalConfigService.DeleteConfig(code, reason);
        if (result && result.Status === 'Y') {
            toastr.success(result.Msg || 'Approval level deleted successfully.');
            await LoadLevelList();
        } else {
            toastr.error(result && result.Msg ? result.Msg : 'Failed to delete approval level.');
        }
    } catch (e) {
        /* toastr already from promiseAjaxCallApi on HTTP error */
    } finally {
        HideLoader();
    }
}

function EscapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function EscapeAttr(str) {
    if (!str) return '';
    return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function navigateToGRNServiceListFromConfig() {
    var base = sessionStorage.getItem('AppBaseURL') || (window.location.origin + '/');
    base = base.replace(/\/?$/, '/');
    window.location.href =
        base + 'PurchaseTransactions/GRNService/GRNService?ModuleDesp=GRN%20Services';
}

window.OpenAddForm = OpenAddForm;
window.OpenEditForm = OpenEditForm;
window.OpenDeleteModal = OpenDeleteModal;
window.ConfirmDeleteLevel = ConfirmDeleteLevel;
window.SaveLevel = SaveLevel;
window.CancelForm = CancelForm;
window.navigateToGRNServiceListFromConfig = navigateToGRNServiceListFromConfig;
