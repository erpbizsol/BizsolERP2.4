import { POApprovalConfigurationService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/POApprovalConfigurationService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';

// ─── GLOBAL STATE ────────────────────────────────────────────────────────────
let G_LevelList = [];
let G_GroupList = [];
let G_EditMode = 'New'; // 'New' | 'Edit'

BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');

// ─── USER RIGHTS HELPER (mirrors PurchaseOrderStore.js pattern) ───────────────
function CheckRight(optionName) {
    const ModuleName = $('#ERPHeading').text().trim();
    const FinYear    = BizSolHelperFunction.getFinancialYear();
    return MenuService.CheckModuleOptionRight(ModuleName, optionName, 'Y', FinYear);
}

// ─── INIT ────────────────────────────────────────────────────────────────────
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

// ─── LOAD GROUPS ─────────────────────────────────────────────────────────────
async function LoadGroupList() {
    try {
        const result = await POApprovalConfigurationService.GetApproverGroupList();
        G_GroupList = result;
    } catch (e) {
        G_GroupList = [];
    }
    PopulateGroupSelect();
}

function PopulateGroupSelect() {
    const sel = document.getElementById('frmGroup');
    sel.innerHTML = '<option value=""></option>'; // blank option required for Select2 placeholder
    G_GroupList.forEach(function (g) {
        const opt = document.createElement('option');
        opt.value = g.Code;
        opt.textContent = g.GroupName;
        sel.appendChild(opt);
    });
    InitSelect2();
}

function InitSelect2() {
    try {
        $('#frmGroup').select2({
            placeholder: 'Search and select group...',
            allowClear: true,
            width: '100%'
        });
    } catch (e) { /* Select2 unavailable */ }
}

// ─── LOAD LEVEL LIST ─────────────────────────────────────────────────────────
async function LoadLevelList() {
    try {
        const result = await POApprovalConfigurationService.GetLevelList();
        G_LevelList = result;
    } catch (e) {
        G_LevelList = [];
    }
    RenderTable();
}

// ─── RENDER TABLE ────────────────────────────────────────────────────────────
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

        const typeBadge = item.ApprovalType === 'User'
            ? '<span class="type-badge-user"><i class="fa fa-user me-1"></i>User</span>'
            : '<span class="type-badge-project"><i class="fa fa-project-diagram me-1"></i>Project</span>';

        const groups = item.GroupName
            ? '<span class="group-tag">' + EscapeHtml(item.GroupName.trim()) + '</span>'
            : '<span style="color:#94a3b8;font-size:0.75rem;">—</span>';

        const delBtn = isLast
            ? '<button type="button" class="btn-del-level ms-1"' +
              ' onclick="OpenDeleteModal(' + item.Code + ',\'' + EscapeAttr(item.LevelDesp) + '\')"' +
              ' title="Delete last level"><i class="fa fa-trash"></i></button>'
            : '';

        return '<tr>' +
            '<td style="text-align:center;color:#94a3b8;font-size:0.75rem;">' + (idx + 1) + '</td>' +
            '<td style="text-align:center;"><span class="level-badge">' + item.Level + '</span></td>' +
            '<td style="font-weight:600;">' + EscapeHtml(item.LevelDesp) + '</td>' +
            '<td style="text-align:center;">' + typeBadge + '</td>' +
            '<td>' + groups + '</td>' +
            '<td style="text-align:center;white-space:nowrap;">' +
                '<button type="button" class="btn-edit-level"' +
                ' onclick="OpenEditForm(' + item.Code + ')" title="Edit level">' +
                '<i class="fa fa-edit"></i></button>' +
                delBtn +
            '</td>' +
        '</tr>';
    }).join('');
}

// ─── OPEN ADD FORM ────────────────────────────────────────────────────────────
function OpenAddForm() {
    CheckRight('New').then(function (respCheck) {
        //if (respCheck.CheckModuleOptionRight === 'N') {
        //    toastr.error(respCheck.Msg);
        //    return;
        //}

        G_EditMode = 'New';

        const nextLevel = G_LevelList.length > 0
            ? Math.max.apply(null, G_LevelList.map(function (l) { return l.Level; })) + 1
            : 1;

        document.getElementById('frmCode').value = '0';
        document.getElementById('frmLevel').value = nextLevel;
        document.getElementById('frmLevelDesc').value = '';
        document.getElementById('frmApprovalType').value = '';

        try { $('#frmGroup').val('').trigger('change'); } catch (e) { }

        document.getElementById('formTitle').textContent = 'Add New Level';
        SetGroupRequired(true);
        HideInfoBar();
        ShowForm();
    });
}

// ─── OPEN EDIT FORM ───────────────────────────────────────────────────────────
async function OpenEditForm(code) {
    const respCheck = await CheckRight('Edit');
    if (respCheck.CheckModuleOptionRight === 'N') {
        toastr.error(respCheck.Msg);
        return;
    }

    G_EditMode = 'Edit';
    Showloader();
    try {
        const result = await POApprovalConfigurationService.GetLevelById(code);
        const item = result[0];
        if (!item) {
            toastr.error('Could not load level data. Please try again.');
            return;
        }

        document.getElementById('frmCode').value = item.Code;
        document.getElementById('frmLevel').value = item.Level;
        document.getElementById('frmLevelDesc').value = item.LevelDesp || '';
        document.getElementById('frmApprovalType').value = item.ApprovalType || '';

        try {
            // SHOWDATA returns GroupName; resolve the Code from the loaded group list
            const matched = G_GroupList.find(function (g) { return g.GroupName === item.GroupName; });
            const groupCode = matched ? String(matched.Code) : '';
            $('#frmGroup').val(groupCode).trigger('change');
        } catch (e) { }

        document.getElementById('formTitle').textContent = 'Edit Level ' + item.Level + ' — ' + (item.LevelDesp || '');
        OnApprovalTypeChange();
        HideInfoBar();
        ShowForm();
    } finally {
        HideLoader();
    }
}

// ─── APPROVAL TYPE CHANGE ─────────────────────────────────────────────────────
function OnApprovalTypeChange() {
    const type = document.getElementById('frmApprovalType').value;
    if (type === 'User') {
        SetGroupRequired(true);
    } else if (type === 'Project') {
        SetGroupRequired(false);
    } else {
        SetGroupRequired(true);
    }
    HideInfoBar();
}

function SetGroupRequired(required) {
    const star = document.getElementById('groupReqStar');
    const hint = document.getElementById('groupOptionalHint');
    if (required) {
        star.style.display = 'inline';
        hint.style.display = 'none';
    } else {
        star.style.display = 'none';
        hint.style.display = 'inline';
    }
}

// ─── SHOW / HIDE FORM ────────────────────────────────────────────────────────
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

// ─── INFO BAR ────────────────────────────────────────────────────────────────
function ShowInfoBar(msg) {
    document.getElementById('formInfoMsg').textContent = msg;
    document.getElementById('formInfoBar').style.display = 'block';
}

function HideInfoBar() {
    document.getElementById('formInfoBar').style.display = 'none';
}

// ─── VALIDATE & SAVE ─────────────────────────────────────────────────────────
async function SaveLevel() {
    const code      = parseInt(document.getElementById('frmCode').value) || 0;
    const level     = parseInt(document.getElementById('frmLevel').value) || 0;
    const levelDesc = document.getElementById('frmLevelDesc').value.trim();
    const apType    = document.getElementById('frmApprovalType').value;

    let groupCode = '0';
    try { groupCode = $('#frmGroup').val() || '0'; } catch (e) { }

    // ── Validation ────────────────────────────────────────────────────────────
    if (!levelDesc) {
        ShowInfoBar('Level Description is required.');
        document.getElementById('frmLevelDesc').focus();
        return;
    }
    if (!apType) {
        ShowInfoBar('Approval Type is required.');
        document.getElementById('frmApprovalType').focus();
        return;
    }
    if (apType === 'User' && groupCode=='0') {
        ShowInfoBar('Group is mandatory when Approval Type is "User".');
        return;
    }

    HideInfoBar();

    const payload = JSON.stringify({
        Code: code,
        Level: level,
        LevelDesp: levelDesc,
        ApprovalType: apType,
        GroupMaster_Code: groupCode
    });

    Showloader();
    try {
        const result = await POApprovalConfigurationService.SavePOApprovalConfig(payload);
        if (result && result.Status ==='Y') {
            toastr.success(result.Msg || 'Approval level saved successfully.');
            CancelForm();
            await LoadLevelList();
        } else {
            toastr.error(result && result.Msg ? result.Msg : 'Failed to save approval level.');
        }
    } finally {
        HideLoader();
    }
}

// ─── DELETE ──────────────────────────────────────────────────────────────────
function OpenDeleteModal(code, levelDesc) {
    if (G_LevelList.length === 0) return;

    const lastItem = G_LevelList[G_LevelList.length - 1];
    if (lastItem.Code != code) {
        toastr.warning('Only the last level can be deleted. You cannot delete levels in between.');
        return;
    }

    document.getElementById('deleteCode').value = code;

    const reasonEl   = document.getElementById('txtDeleteReason');
    const reasonErrEl = document.getElementById('deleteReasonError');
    if (reasonEl)    reasonEl.value = '';
    if (reasonErrEl) reasonErrEl.style.display = 'none';

    document.getElementById('deleteConfirmMsg').innerHTML =
        'Are you sure you want to delete level <strong>&ldquo;' + EscapeHtml(levelDesc) + '&rdquo;</strong>?' +
        '<br><small style="color:#94a3b8;margin-top:4px;display:block;">This action cannot be undone.</small>';

    const modal = new bootstrap.Modal(document.getElementById('modalDeleteLevel'));
    modal.show();
    // Focus reason input after modal opens
    document.getElementById('modalDeleteLevel').addEventListener('shown.bs.modal', function focusReason() {
        const el = document.getElementById('txtDeleteReason');
        if (el) el.focus();
        document.getElementById('modalDeleteLevel').removeEventListener('shown.bs.modal', focusReason);
    });
}

async function ConfirmDeleteLevel() {
    const code      = parseInt(document.getElementById('deleteCode').value) || 0;
    const reasonEl  = document.getElementById('txtDeleteReason');
    const errEl     = document.getElementById('deleteReasonError');
    const reason    = reasonEl ? reasonEl.value.trim() : '';
    if (code === 0) return;

    // Validate reason
    if (!reason) {
        if (errEl)    errEl.style.display = 'block';
        if (reasonEl) reasonEl.focus();
        return;
    }
    if (errEl) errEl.style.display = 'none';

    const modalEl = document.getElementById('modalDeleteLevel');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    Showloader();
    try {
        const respCheck = await CheckRight('Delete');
        //if (respCheck.CheckModuleOptionRight === 'N') {
        //    toastr.error(respCheck.Msg);
        //    return;
        //}

        const result = await POApprovalConfigurationService.DeletePOApprovalConfig(code, reason);
        if (result && result.Status === 'Y') {
            toastr.success(result.Msg || 'Approval level deleted successfully.');
            await LoadLevelList();
        } else {
            toastr.error(result && result.Msg ? result.Msg : 'Failed to delete approval level.');
        }
    } finally {
        HideLoader();
    }
}

// ─── UTILS ───────────────────────────────────────────────────────────────────
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

// ─── EXPOSE TO GLOBAL (onclick handlers in HTML) ─────────────────────────────
window.OpenAddForm          = OpenAddForm;
window.OpenEditForm         = OpenEditForm;        // async — returns Promise; onclick is fine
window.OpenDeleteModal      = OpenDeleteModal;
window.ConfirmDeleteLevel   = ConfirmDeleteLevel;
window.SaveLevel            = SaveLevel;
window.CancelForm           = CancelForm;
window.OnApprovalTypeChange = OnApprovalTypeChange;
