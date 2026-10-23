/**
 * AdminTools.js
 * Administrative Tools – Admin Password Gate + Menu Hide/Unhide Management
 */

import { AdminToolsService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/AdminToolsService.js';
import { UserRightDashboardService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_UserRightDashboardService.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';

// ─── Admin password validation via HomeController.ValidateAdminPassword ───────
// Password variable is managed in:
//   BizsolERPMain/Controllers/HomeController.cs  →  AdminToolsPasswordHash
function validatePasswordLocally(password) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: '/Home/ValidateAdminPassword',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ Password: password }),
            dataType: 'json',
            success: function (response) { resolve(response); },
            error: function (xhr, status, error) {
                reject({ message: status + ': ' + error });
            }
        });
    });
}

// ─── Global State ────────────────────────────────────────────────────────────
var G_IsAdminAuthenticated = false;
var G_SelectedCompanyCode = '';   // Currently selected company code
var G_AllMenuItems = [];          // Full list from API
var G_FilteredMenuItems = [];     // After search/filter
var G_ChangedMenuItems = {};      // { MenuCode: { MenuCode, IsHidden } }
var G_OriginalMenuItems = {};     // Snapshot for cancel

// ─── Bootstrap modal reference ───────────────────────────────────────────────
var adminPasswordModal = null;
var adminConfirmModal = null;
var adminConfirmCallback = null;

// ─── DOMContentLoaded ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    ensureBizSolAccess().then(function (allowed) {
        if (!allowed) {
            showAdminToolsDenied();
            return;
        }
        initAdminPasswordModal();
        bindEvents();
    });
});

function isBizSolUserRow(row) {
    var v = String((row && (row.IsBizSolUser || row.isBizSolUser)) || '').trim().toUpperCase();
    return v === 'Y' || v === 'YES';
}

function ensureBizSolAccess() {
    var cached = null;
    try {
        var details = JSON.parse(sessionStorage.getItem('UserDetails') || 'null');
        cached = Array.isArray(details) ? details[0] : details;
    } catch (e) {
        cached = null;
    }
    if (cached) {
        return Promise.resolve(isBizSolUserRow(cached));
    }
    return MenuService.GetUserDetails().then(function (res) {
        var row = Array.isArray(res) ? res[0] : null;
        return isBizSolUserRow(row);
    }).catch(function () {
        return false;
    });
}

function showAdminToolsDenied() {
    var modalEl = document.getElementById('adminPasswordModal');
    if (modalEl && window.bootstrap) {
        var existing = bootstrap.Modal.getInstance(modalEl);
        if (existing) existing.hide();
    }
    var locked = document.getElementById('divAdminLocked');
    if (locked) {
        locked.style.display = 'flex';
        locked.innerHTML = '<i class="fas fa-lock"></i><p class="fw-semibold text-muted mb-0">Admin Tools is available only for Bizsol users.</p>';
    }
    var content = document.getElementById('divAdminContent');
    if (content) content.style.display = 'none';
}

// ─── Modal Init ──────────────────────────────────────────────────────────────
function initAdminPasswordModal() {
    adminPasswordModal = new bootstrap.Modal(document.getElementById('adminPasswordModal'), {
        backdrop: 'static',
        keyboard: false
    });
    adminPasswordModal.show();

    // Focus password field after modal is shown
    document.getElementById('adminPasswordModal').addEventListener('shown.bs.modal', function () {
        document.getElementById('txtAdminPassword').focus();
    });
}

// ─── Event Bindings ──────────────────────────────────────────────────────────
function bindEvents() {

    // Validate password button
    document.getElementById('btnValidateAdminPassword').addEventListener('click', validateAdminPassword);

    // Press Enter in password field
    document.getElementById('txtAdminPassword').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') validateAdminPassword();
    });

    // Toggle password visibility
    document.getElementById('btnToggleAdminPwd').addEventListener('click', function () {
        var input = document.getElementById('txtAdminPassword');
        var icon = document.getElementById('iconToggleAdminPwd');
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    });

    // Re-open password modal from locked screen
    document.getElementById('btnShowPasswordModal').addEventListener('click', function () {
        document.getElementById('txtAdminPassword').value = '';
        clearPasswordError();
        adminPasswordModal.show();
    });

    // Company dropdown change → reload menus
    document.getElementById('selCompany').addEventListener('change', function () {
        G_SelectedCompanyCode = this.value;
        G_ChangedMenuItems = {};
        updateSaveBadge();
        if (G_SelectedCompanyCode) {
            loadMenuList();
        } else {
            showMenuState('empty');
        }
    });

    // Search / filter
    document.getElementById('txtMenuSearch').addEventListener('input', applyFilters);
    document.getElementById('selVisibilityFilter').addEventListener('change', applyFilters);

    // Refresh
    document.getElementById('btnRefreshMenuList').addEventListener('click', function () {
        G_ChangedMenuItems = {};
        loadMenuList();
    });

    // Save
    document.getElementById('btnSaveMenuVisibility').addEventListener('click', saveMenuVisibilityChanges);

    // Cancel
    document.getElementById('btnCancelMenuChanges').addEventListener('click', cancelMenuChanges);

    adminConfirmModal = new bootstrap.Modal(document.getElementById('adminConfirmModal'), {
        backdrop: 'static',
        keyboard: false
    });
    document.getElementById('btnAdminConfirmOk').addEventListener('click', function () {
        var fn = adminConfirmCallback;
        adminConfirmCallback = null;
        adminConfirmModal.hide();
        if (typeof fn === 'function') fn();
    });
    document.getElementById('btnAdminConfirmCancel').addEventListener('click', function () {
        adminConfirmCallback = null;
        adminConfirmModal.hide();
    });
}

function showAdminConfirm(title, message, okText, onConfirm, iconClass) {
    document.getElementById('adminConfirmTitleText').textContent = title || 'Confirm';
    document.getElementById('adminConfirmMessage').textContent = message || 'Are you sure?';
    document.getElementById('adminConfirmIcon').className = iconClass || 'fas fa-circle-question';
    document.getElementById('btnAdminConfirmOk').innerHTML = '<i class="fas fa-check"></i>' + (okText || 'OK');
    adminConfirmCallback = onConfirm;
    adminConfirmModal.show();
}

// ─── Admin Password Validation ───────────────────────────────────────────────
function validateAdminPassword() {
    var password = (document.getElementById('txtAdminPassword').value || '').trim();

    if (!password) {
        showPasswordError('Please enter the admin password.');
        return;
    }

    clearPasswordError();
    showLoader(true);

    // Validate via HomeController.ValidateAdminPassword
    validatePasswordLocally(password)
        .then(function (response) {
            showLoader(false);
            if (response && response.isValid === true) {
                onPasswordValidated();
            } else {
                var msg = (response && response.message) || 'Invalid admin password. Please try again.';
                showPasswordError(msg);
                document.getElementById('txtAdminPassword').value = '';
                document.getElementById('txtAdminPassword').focus();
            }
        })
        .catch(function (err) {
            showLoader(false);
            showPasswordError('Authentication failed. Please check your connection and try again.');
            console.error('Admin password validation error:', err);
        });
}

function onPasswordValidated() {
    G_IsAdminAuthenticated = true;
    adminPasswordModal.hide();

    // Show admin content
    document.getElementById('divAdminLocked').style.display = 'none';
    document.getElementById('divAdminContent').style.display = 'block';

    // Load company list first, then menus
    loadCompanyDropdown();
}

// ─── Company Dropdown (from UserRightDashboard) ───────────────────────────────
function loadCompanyDropdown() {
    var sel = document.getElementById('selCompany');
    sel.innerHTML = '<option value="">-- Loading... --</option>';
    sel.disabled = true;

    UserRightDashboardService.GetCompanyMasterList()
        .then(function (response) {
            var list = asList(response);
            sel.innerHTML = '<option value="">-- Select Company --</option>';
            list.forEach(function (co) {
                var code = co.Code || co.code || co.CompanyCode || co.companyCode || '';
                var name = co.CompanyName || co.companyName || co.Name || co.name || String(code);
                var opt = document.createElement('option');
                opt.value = code;
                opt.textContent = name;
                sel.appendChild(opt);
            });
            sel.disabled = false;

            // Auto-select session company
            var sessionCode = (JSON.parse(sessionStorage.getItem('authKey') || '{}').CompanyCode || '');
            if (sessionCode && sel.querySelector('option[value="' + sessionCode + '"]')) {
                sel.value = sessionCode;
                G_SelectedCompanyCode = sessionCode;
                loadMenuList();
            } else if (list.length > 0) {
                sel.selectedIndex = 1;
                G_SelectedCompanyCode = sel.value;
                loadMenuList();
            } else {
                showMenuState('empty');
            }
        })
        .catch(function (err) {
            sel.innerHTML = '<option value="">-- Failed to load companies --</option>';
            sel.disabled = false;
            console.error('Load company list error:', err);
            toastr.error('Failed to load company list.');
        });
}

function showPasswordError(msg) {
    var el = document.getElementById('adminPasswordError');
    el.textContent = msg;
    el.style.display = 'block';
}

function clearPasswordError() {
    var el = document.getElementById('adminPasswordError');
    el.textContent = '';
    el.style.display = 'none';
}

function showLoader(show) {
    document.getElementById('adminPwdLoader').style.display = show ? 'block' : 'none';
    document.getElementById('btnValidateAdminPassword').disabled = show;
}

// ─── Menu List Loading ────────────────────────────────────────────────────────
function loadMenuList() {
    showMenuState('loading');
    G_ChangedMenuItems = {};
    updateSaveBadge();

    // GET api/AdminTools/GetAllMenus?CompanyCode=X
    AdminToolsService.GetAllMenus(G_SelectedCompanyCode)
        .then(function (response) {
            var list = asList(response);
            G_AllMenuItems = list;
            G_OriginalMenuItems = buildOriginalSnapshot(list);

            if (!list || list.length === 0) {
                showMenuState('empty');
                return;
            }

            applyFilters();
            showMenuState('table');
        })
        .catch(function (err) {
            showMenuState('empty');
            console.error('Load menu list error:', err);
            toastr.error('Failed to load menu list.');
        });
}

function asList(response) {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (response.$values && Array.isArray(response.$values)) return response.$values;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.Data)) return response.Data;
    if (Array.isArray(response.value)) return response.value;
    if (Array.isArray(response.Value)) return response.Value;
    return [];
}

function buildOriginalSnapshot(list) {
    var snap = {};
    list.forEach(function (item) {
        var code = getMenuCode(item);
        snap[code] = isHidden(item);
    });
    return snap;
}

function getMenuCode(item) {
    // SP returns UserModuleMaster_Code from GETALLMENUS
    return item.UserModuleMaster_Code || item.MenuCode || item.menuCode || item.Code || item.code || '';
}

function getMenuName(item) {
    // SP returns MenuName column from UserModuleMaster e.g. "MnuTools(100)"
    return item.MenuName || item.menuName || item.OptionName || item.Name || item.name || '';
}

function getMenuDesc(item) {
    // SP returns ModuleDescription (alias of ModuleDesp)
    return item.ModuleDescription || item.moduleDescription || item.ModuleDesp || item.moduleDesp
        || item.MenuDescription || item.Description || item.description || '';
}

function getModuleName(item) {
    // SP returns MasterModuleCode as integer; DotNetMainMenuName as module identifier
    return item.DotNetMainMenuName || item.dotNetMainMenuName
        || item.ModuleName || item.moduleName || item.Module || item.module
        || (item.MasterModuleCode ? 'Module ' + item.MasterModuleCode : '') || '';
}

function isHidden(item) {
    // SP returns IsHidden = 'Y' / 'N'
    var val = item.IsHidden || item.isHidden || item.Hidden || item.hidden;
    if (val === true || val === 'Y' || val === 'y' || val === 1 || val === '1') return true;
    return false;
}


// ─── Tree Builder ─────────────────────────────────────────────────────────────
// Builds a nested tree from flat list using MasterModuleCode → parent Code link.
function buildTree(items) {
    var nodeMap = {};

    // Index all items by their code
    items.forEach(function (item) {
        var code = String(getMenuCode(item));
        nodeMap[code] = { item: item, children: [] };
    });

    var roots = [];

    items.forEach(function (item) {
        var code = String(getMenuCode(item));
        var parentCode = String(item.MasterModuleCode || item.masterModuleCode || 0);

        if (parentCode && parentCode !== '0' && nodeMap[parentCode]) {
            nodeMap[parentCode].children.push(nodeMap[code]);
        } else {
            roots.push(nodeMap[code]);
        }
    });

    return roots;
}

// ─── Filtering ────────────────────────────────────────────────────────────────
function applyFilters() {
    var searchText = (document.getElementById('txtMenuSearch').value || '').toLowerCase().trim();
    var visibilityFilter = document.getElementById('selVisibilityFilter').value;

    if (searchText || visibilityFilter) {
        // Flat filtered list when searching
        G_FilteredMenuItems = G_AllMenuItems.filter(function (item) {
            if (searchText) {
                var desc = getMenuDesc(item).toLowerCase();
                if (desc.indexOf(searchText) === -1) return false;
            }
            if (visibilityFilter) {
                var code = getMenuCode(item);
                var hidden = (code in G_ChangedMenuItems) ? G_ChangedMenuItems[code].IsHidden : isHidden(item);
                if (visibilityFilter === 'visible' && hidden) return false;
                if (visibilityFilter === 'hidden' && !hidden) return false;
            }
            return true;
        });
        renderFlatTable(G_FilteredMenuItems);
    } else {
        // Full tree view when no filter
        G_FilteredMenuItems = G_AllMenuItems;
        var tree = buildTree(G_AllMenuItems);
        renderTreeTable(tree);
    }
}

// ─── Flat Table Rendering (used when search/filter is active) ─────────────────
function renderFlatTable(items) {
    var tbody = document.getElementById('tblMenuVisibilityBody');
    tbody.innerHTML = '';

    if (!items || items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4"><i class="fas fa-search me-2"></i>No menus found matching the filter.</td></tr>';
        return;
    }

    items.forEach(function (item, index) {
        tbody.appendChild(buildMenuRow(item, index + 1, 0, false));
    });

    bindToggleEvents(tbody);
}

// ─── Tree Table Rendering (used when no filter is active) ─────────────────────
var G_ExpandedNodes = {};  // { code: true/false }

function renderTreeTable(roots) {
    var tbody = document.getElementById('tblMenuVisibilityBody');
    tbody.innerHTML = '';

    if (!roots || roots.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4"><i class="fas fa-list-ul me-2"></i>No menu items found.</td></tr>';
        return;
    }

    var rowIndex = { n: 1 };
    roots.forEach(function (node) {
        renderTreeNode(tbody, node, 0, rowIndex);
    });

    bindToggleEvents(tbody);
    bindExpandEvents(tbody);
}

function renderTreeNode(tbody, node, level, rowIndex) {
    var item = node.item;
    var code = String(getMenuCode(item));
    var hasChildren = node.children && node.children.length > 0;

    // Auto-expand first level
    if (level === 0 && !(code in G_ExpandedNodes)) {
        G_ExpandedNodes[code] = true;
    }
    var isExpanded = G_ExpandedNodes[code] === true;

    tbody.appendChild(buildMenuRow(item, rowIndex.n++, level, hasChildren, isExpanded));

    if (hasChildren && isExpanded) {
        node.children.forEach(function (child) {
            renderTreeNode(tbody, child, level + 1, rowIndex);
        });
    }
}

// ─── Build a single <tr> row ──────────────────────────────────────────────────
var INDENT_PX = 24;   // pixels per level

function buildMenuRow(item, index, level, hasChildren, isExpanded) {
    var code = String(getMenuCode(item));
    var currentlyHidden = (code in G_ChangedMenuItems) ? G_ChangedMenuItems[code].IsHidden : isHidden(item);
    var isChecked = !currentlyHidden;
    var isChanged = (code in G_ChangedMenuItems) && (G_ChangedMenuItems[code].IsHidden !== G_OriginalMenuItems[code]);

    // ── Expand / Collapse button ──────────────────────────────────────────────
    var toggleBtn = '';
    if (hasChildren) {
        toggleBtn =
            '<button type="button" class="tree-toggle-btn" data-node-code="' + code + '" title="' + (isExpanded ? 'Collapse' : 'Expand') + '">'
            + (isExpanded ? '&#x2212;' : '&#x2B;')   // − or +
            + '</button>';
    } else {
        toggleBtn = '<span class="tree-leaf-dot"></span>';
    }

    // ── Tree connector lines (vertical bar segments for each ancestor level) ──
    var connectors = '';
    for (var l = 0; l < level; l++) {
        connectors += '<span class="tree-line' + (l === level - 1 ? ' tree-corner' : ' tree-vert') + '"></span>';
    }

    // ── Row background ────────────────────────────────────────────────────────
    var rowClass = (level === 0 ? 'tree-row-root' : (level === 1 ? 'tree-row-l1' : 'tree-row-l2'));

    var row = document.createElement('tr');
    row.setAttribute('data-menu-code', code);
    row.setAttribute('data-level', level);
    if (hasChildren) row.setAttribute('data-has-children', '1');
    if (isChanged) row.classList.add('table-warning');
    row.classList.add(rowClass);

    // ── ApplicableForWebErp value ─────────────────────────────────────────────
    var appFor = String(item.ApplicableForWebErp || item.applicableForWebErp || 'Y').trim().toUpperCase();
    if (appFor !== 'N' && appFor !== 'W') appFor = 'Y';

    row.innerHTML =
        '<td class="tree-sno">' + index + '</td>' +
        '<td class="text-center tree-vis-cell">' +
            '<button type="button" class="eye-vis-btn ' + (isChecked ? 'show' : 'hide') + '" data-menu-code="' + code + '" title="' + (isChecked ? 'Visible. Click to hide.' : 'Hidden. Click to show.') + '">' +
                '<i class="fas ' + (isChecked ? 'fa-eye' : 'fa-eye-slash') + '"></i>' +
            '</button>' +
        '</td>' +
        '<td class="text-center tree-appfor-cell">' +
            '<select class="appfor-select form-select form-select-sm" data-menu-code="' + code + '" title="Applicable For">' +
                '<option value="Y"' + (appFor === 'Y' ? ' selected' : '') + '>Both</option>' +
                '<option value="N"' + (appFor === 'N' ? ' selected' : '') + '>ERP</option>' +
                '<option value="W"' + (appFor === 'W' ? ' selected' : '') + '>Web ERP</option>' +
            '</select>' +
        '</td>' +
        '<td class="tree-desc-cell">' +
            '<span class="tree-connectors">' + connectors + '</span>' +
            toggleBtn +
            '<span class="tree-label tree-label-l' + level + '">' + escHtml(getMenuDesc(item)) + '</span>' +
        '</td>';

    return row;
}

// ─── Expand / Collapse event binding ─────────────────────────────────────────
function bindExpandEvents(tbody) {
    tbody.querySelectorAll('.tree-toggle-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var code = btn.getAttribute('data-node-code');
            G_ExpandedNodes[code] = !(G_ExpandedNodes[code] === true);
            var tree = buildTree(G_AllMenuItems);
            renderTreeTable(tree);
        });
    });
}

function bindToggleEvents(tbody) {
    tbody.querySelectorAll('.eye-vis-btn').forEach(function (btn) {
        btn.addEventListener('click', onMenuToggleChanged);
    });
    tbody.querySelectorAll('.appfor-select').forEach(function (sel) {
        sel.addEventListener('change', onApplicableForChanged);
    });
}

function escHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ─── Toggle Change Handler ────────────────────────────────────────────────────
function onMenuToggleChanged(e) {
    var btn = e.currentTarget;
    var code = btn.getAttribute('data-menu-code');
    var isVisible = btn.classList.contains('hide');
    var isHiddenNow = !isVisible;

    // Update G_ChangedMenuItems
    var originalHidden = G_OriginalMenuItems[code];
    if (isHiddenNow === originalHidden) {
        delete G_ChangedMenuItems[code];
    } else {
        G_ChangedMenuItems[code] = { MenuCode: code, IsHidden: isHiddenNow };
    }

    var icon = btn.querySelector('i');
    btn.className = 'eye-vis-btn ' + (isVisible ? 'show' : 'hide');
    icon.className = 'fas ' + (isVisible ? 'fa-eye' : 'fa-eye-slash');
    btn.title = isVisible ? 'Visible. Click to hide.' : 'Hidden. Click to show.';

    var row = btn.closest('tr');

    var isChanged = code in G_ChangedMenuItems;
    if (isChanged) {
        row.classList.add('table-warning');
    } else {
        row.classList.remove('table-warning');
    }

    updateSaveBadge();
}

// ─── Applicable For Change Handler ───────────────────────────────────────────
function onApplicableForChanged(e) {
    var sel = e.target;
    var menuCode   = sel.getAttribute('data-menu-code');
    var newStatus  = sel.value;         // 'Y' | 'N' | 'W'
    var labelMap   = { 'Y': 'Both', 'N': 'ERP', 'W': 'Web ERP' };

    sel.disabled = true;

    AdminToolsService.UpdateApplicableFor(menuCode, newStatus)
        .then(function (response) {
            sel.disabled = false;
            var ok = response && (
                response.Status === 'Y' || response.status === 'Y' ||
                response.Status === 'Success' || response.status === 'success' ||
                response === true || response.isSuccess === true
            );
            if (ok) {
                toastr.success('Applicable For updated to "' + labelMap[newStatus] + '".');
                // Update local data so tree re-renders correctly
                G_AllMenuItems.forEach(function (item) {
                    if (String(getMenuCode(item)) === String(menuCode)) {
                        if ('ApplicableForWebErp'  in item) item.ApplicableForWebErp  = newStatus;
                        if ('applicableForWebErp'  in item) item.applicableForWebErp  = newStatus;
                    }
                });
            } else {
                var msg = (response && (response.Msg || response.msg || response.Message || response.message)) || 'Update failed.';
                toastr.error(msg);
                // Revert dropdown on failure — re-read from AllMenuItems
                G_AllMenuItems.forEach(function (item) {
                    if (String(getMenuCode(item)) === String(menuCode)) {
                        var orig = String(item.ApplicableForWebErp || item.applicableForWebErp || 'Y').trim().toUpperCase();
                        sel.value = (orig === 'N' || orig === 'W') ? orig : 'Y';
                    }
                });
            }
        })
        .catch(function (err) {
            sel.disabled = false;
            toastr.error('Error updating Applicable For. Please try again.');
            console.error('UpdateApplicableFor error:', err);
        });
}

// ─── Save Badge ───────────────────────────────────────────────────────────────
function updateSaveBadge() {
    var count = Object.keys(G_ChangedMenuItems).length;
    var badge = document.getElementById('btnSaveMenuCount');
    if (count > 0) {
        badge.textContent = count + ' change' + (count > 1 ? 's' : '');
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

// ─── Save Changes ─────────────────────────────────────────────────────────────
// Calls POST api/AdminTools/SaveMenuVisibility
// Splits changed items into two CSV strings: MenuCodesToHide and MenuCodesToUnhide
function saveMenuVisibilityChanges() {
    var changedList = Object.values(G_ChangedMenuItems);

    if (changedList.length === 0) {
        toastr.info('No changes to save.');
        return;
    }

    showAdminConfirm(
        'Save Changes',
        'Save visibility changes for ' + changedList.length + ' menu item(s)?',
        'Save',
        function () { performSaveMenuVisibility(changedList); },
        'fas fa-save'
    );
}

function performSaveMenuVisibility(changedList) {
    // Split into two CSV lists for the API
    var codesToHide   = changedList.filter(function (x) { return x.IsHidden === true; })
                                   .map(function (x) { return x.MenuCode; }).join(',');
    var codesToUnhide = changedList.filter(function (x) { return x.IsHidden === false; })
                                   .map(function (x) { return x.MenuCode; }).join(',');

    var btn = document.getElementById('btnSaveMenuVisibility');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span>Saving...';

    // POST api/AdminTools/SaveMenuVisibility
    AdminToolsService.SaveMenuVisibility(codesToHide, codesToUnhide, G_SelectedCompanyCode)
        .then(function (response) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save me-1"></i>Save Changes<span id="btnSaveMenuCount" class="badge bg-warning text-dark ms-1" style="display:none;"></span>';

            // SP returns { Status: 'Y', Msg: '...' }
            if (response && (response.Status === 'Y' || response.status === 'Y'
                || response.Status === 'Success' || response.status === 'success'
                || response === true || response.isSuccess === true)) {
                toastr.success('Menu visibility saved successfully.');
                G_ChangedMenuItems = {};
                updateSaveBadge();
                loadMenuList();  // Refresh from API
            } else {
                var msg = (response && (response.Msg || response.msg || response.Message || response.message))
                          || 'Failed to save changes.';
                toastr.error(msg);
            }
        })
        .catch(function (err) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save me-1"></i>Save Changes<span id="btnSaveMenuCount" class="badge bg-warning text-dark ms-1" style="display:none;"></span>';
            toastr.error('Error saving changes. Please try again.');
            console.error('Save menu visibility error:', err);
        });
}

// ─── Cancel Changes ───────────────────────────────────────────────────────────
function cancelMenuChanges() {
    if (Object.keys(G_ChangedMenuItems).length === 0) return;

    showAdminConfirm(
        'Discard Changes',
        'Discard all unsaved changes?',
        'Discard',
        function () {
            G_ChangedMenuItems = {};
            updateSaveBadge();
            applyFilters();
            toastr.info('Changes discarded.');
        },
        'fas fa-trash-alt'
    );
}

// ─── UI State Manager ─────────────────────────────────────────────────────────
function showMenuState(state) {
    document.getElementById('menuVisibilityLoader').style.display = (state === 'loading') ? 'flex' : 'none';
    document.getElementById('divMenuVisibilityTable').style.display = (state === 'table') ? 'block' : 'none';
    document.getElementById('divMenuVisibilityEmpty').style.display = (state === 'empty') ? 'flex' : 'none';
}
