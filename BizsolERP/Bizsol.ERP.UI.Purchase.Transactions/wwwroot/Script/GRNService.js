import { GRNService }          from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_GRNService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService }          from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';

// ── Numeric input helpers ────────────────────────────────────────────────────
// Block e, E, +, - keys that browsers allow in type="number"
function blockNonNumeric(e) {
    if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
}
// Strip any remaining non-numeric characters (paste, autofill, etc.)
function stripNonNumeric(el) {
    const val = el.value;
    const cleaned = val.replace(/[^0-9.]/g, '')   // keep digits and one dot
                       .replace(/(\..*)\./g, '$1');  // allow only one decimal point
    if (val !== cleaned) el.value = cleaned;
}

// ── App-level state ─────────────────────────────────────────────────────────
let files             = [];
let fileName          = '';
let imageBase64Data   = [];
let existingImageData = [];
let existingFileName  = '';
let rowIndex          = 0;
let poList            = [];
let editMode          = false;
let editCode          = 0;
$(document).ready(async function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");
}); 
// ── DOM ready ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([
        loadVendorList(),
        loadProjectList(),
        loadAllPOs(),
    ]);
    await loadGRNList();
    showListView();
});

// ══════════════════════════════════════════════════════════════════════════════
// VIEW TOGGLE
// ══════════════════════════════════════════════════════════════════════════════
function showListView() {
    document.getElementById('divGRNList').style.display = 'block';
    document.getElementById('divGRNForm').style.display = 'none';
    document.getElementById('floatBar').style.display   = 'none';
}

function showFormView() {
    document.getElementById('divGRNList').style.display = 'none';
    document.getElementById('divGRNForm').style.display = 'block';
    document.getElementById('floatBar').style.display   = 'flex';
    syncFloatBarMargin();
}

function syncFloatBarMargin() {
    const sidebar = document.getElementById('modern-sidebar');
    const bar     = document.getElementById('floatBar');
    if (!sidebar || !bar || window.innerWidth <= 768) {
        if (bar) bar.style.marginLeft = '';
        return;
    }
    bar.style.marginLeft = sidebar.classList.contains('collapsed') ? '70px' : '280px';
}

// ══════════════════════════════════════════════════════════════════════════════
// DATE DEFAULTS
// ══════════════════════════════════════════════════════════════════════════════
function setTodayDates() {
    const today = new Date().toISOString().split('T')[0];
    ['dtRecvDate'].forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.value) el.value = today;
    });
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 1 — VENDOR LIST → ddlPartyName
// ══════════════════════════════════════════════════════════════════════════════
async function loadVendorList() {
    const ddl = document.getElementById('ddlPartyName');
    if (!ddl) return;
    try {
        const result = await GRNService.GetVendor();
        ddl.innerHTML = '<option value="">-- Select Party --</option>';
        (result || []).forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.VendorMaster_Code ?? v.vendorMaster_Code ?? v.Code ?? '';
            opt.text  = v.VendorName        ?? v.vendorName        ?? v.Name ?? '';
            ddl.appendChild(opt);
        });
    } catch (e) {
        console.error('Failed to load vendors:', e);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 2 — PROJECT LIST → frmDdlProject
// ══════════════════════════════════════════════════════════════════════════════
async function loadProjectList() {
    const ddl = document.getElementById('frmDdlProject');
    if (!ddl) return;
    try {
        const result = await GRNService.GetProjectList();
        ddl.innerHTML = '<option value="">-- Select Project --</option>';
        (result || []).forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.ProjectMaster_Code ?? p.projectMaster_Code ?? p.Code ?? '';
            opt.text  = p.ProjectName        ?? p.projectName        ?? p.Name ?? '';
            ddl.appendChild(opt);
        });
    } catch (e) {
        console.error('Failed to load projects:', e);
    }
}

// ── Project toggle ──────────────────────────────────────────────────────────
// ── Show a placeholder row in grid asking user to select project first ────────
function showGridProjectHint() {
    const tbody = document.getElementById('itemTbody');
    if (!tbody) return;
    tbody.innerHTML = `
        <tr id="trProjectHint">
            <td colspan="11" style="text-align:center;padding:18px 10px;">
                <div style="display:inline-flex;align-items:center;gap:10px;
                            background:linear-gradient(135deg,rgba(13,202,240,0.08),rgba(8,145,178,0.06));
                            border:1px dashed rgba(13,202,240,0.45);border-radius:10px;
                            padding:12px 20px;">
                    <i class="fa fa-info-circle" style="color:#0dcaf0;font-size:1.1rem;"></i>
                    <span style="font-size:0.82rem;color:#475569;">
                        Please select <strong style="color:#0891b2;">Project Name</strong>
                        and <strong style="color:#0891b2;">Sub Project</strong> to load items.
                    </span>
                </div>
            </td>
        </tr>`;
    calcTotal();
    updateMobileCards();
}

function setAddItemBtnState(enabled) {
    const btn = document.querySelector('.add-item-btn');
    if (!btn) return;
    btn.disabled = !enabled;
    btn.style.opacity = enabled ? '1' : '0.45';
    btn.style.cursor  = enabled ? 'pointer' : 'not-allowed';
}

function toggleProjectFields(chk) {
    const fields = document.getElementById('divProjectFields');
    const hint   = document.getElementById('divProjectHint');

    if (chk.checked) {
        // Against Project ON → show fields, hide hint, clear poList
        if (fields) fields.style.display = 'block';
        if (hint)   hint.style.display   = 'none';
        poList = [];
        rowIndex = 0;
        // Show placeholder in grid and disable Add Item until project+sub-project selected
        showGridProjectHint();
        setAddItemBtnState(false);
    } else {
        // Against Project OFF → hide fields, show hint, restore all POs for manual entry
        if (fields) fields.style.display = 'none';
        if (hint)   hint.style.display   = 'block';
        document.getElementById('frmDdlProject').value       = '';
        document.getElementById('frmDdlSubProject').innerHTML =
            '<option value="">-- Select Sub Project --</option>';
        // Re-enable Add Item and restore normal empty row
        setAddItemBtnState(true);
        document.getElementById('itemTbody').innerHTML = '';
        rowIndex = 0;
        addItemRow();
        loadAllPOs();
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 3 — PROJECT CHANGE → SubProject dropdown
// ══════════════════════════════════════════════════════════════════════════════
async function loadSubProjects() {
    const projectId = document.getElementById('frmDdlProject')?.value;
    const subDdl    = document.getElementById('frmDdlSubProject');
    if (!subDdl) return;

    subDdl.innerHTML = '<option value="">-- Select Sub Project --</option>';

    // Clear grid when project changes
    document.getElementById('itemTbody').innerHTML = '';
    rowIndex = 0;
    calcTotal();

    if (!projectId) {
        const isAgainstProject = document.getElementById('chkAgainstProject')?.checked;
        if (!isAgainstProject) {
            await loadAllPOs();
            addItemRow();
        } else {
            showGridProjectHint();
            setAddItemBtnState(false);
        }
        return;
    }

    try {
        const subResult = await GRNService.GetSubProjectList(projectId);
        (subResult || []).forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.SubProjectMaster_Code ?? s.subProjectMaster_Code ?? s.Code ?? '';
            opt.text  = s.SubProjectName        ?? s.subProjectName        ?? s.Name ?? '';
            subDdl.appendChild(opt);
        });
    } catch (e) {
        console.error('Failed to load sub-projects:', e);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 3b — SUB-PROJECT CHANGE → auto-bind POs + items into grid
// ══════════════════════════════════════════════════════════════════════════════
async function onSubProjectChange() {
    // Clear validation error
    document.getElementById('frmDdlSubProject')?.classList.remove('is-invalid');

    const projectCode    = document.getElementById('frmDdlProject')?.value;
    const subProjectCode = document.getElementById('frmDdlSubProject')?.value;

    document.getElementById('itemTbody').innerHTML = '';
    rowIndex = 0;

    if (!projectCode || !subProjectCode) {
        // Not fully selected yet — show placeholder and keep Add Item disabled
        showGridProjectHint();
        setAddItemBtnState(false);
        return;
    }

    // Both selected — enable Add Item and auto-fill grid
    setAddItemBtnState(true);
    await loadItemsByProject(projectCode, subProjectCode);
}

// ── Fetch items for project+subproject and auto-fill grid rows ───────────────
async function loadItemsByProject(projectCode, subProjectCode) {
    showToast('Loading items for selected project...', 'info');

    try {
        const result = await GRNService.GetPOItemDetails(projectCode, subProjectCode);

        if (!result || result.length === 0) {
            addItemRow();
            showToast('No pending items found for selected project.', 'info');
            return;
        }

        result.forEach(item => {
            addItemRow();
            const tbody = document.getElementById('itemTbody');
            const tr    = tbody.rows[tbody.rows.length - 1];

            // ── PO dropdown — SQL returns: PurchaseOrderMaster_Code, PoNO ────
            const poSel  = tr.querySelector('.po-select');
            const poCode = item.PurchaseOrderMaster_Code ?? item.PurchaseOrder_Code ?? '';
            const poNo   = item.PoNO ?? item.PONo ?? item.PO_No ?? '';
            if (poSel && poCode) {
                if (!Array.from(poSel.options).some(o => String(o.value) === String(poCode))) {
                    const opt = document.createElement('option');
                    opt.value = poCode;
                    opt.text  = poNo || `PO-${poCode}`;
                    poSel.appendChild(opt);
                }
                poSel.value = poCode;
            }

            // ── Item dropdown — SQL returns: ItemMaster_Code, ItemName ───────
            const itSel    = tr.querySelector('.item-select');
            const itemCode = item.ItemMaster_Code ?? item.Item_Code ?? '';
            const itemName = item.ItemName        ?? item.Item_Name ?? '';
            const rate     = parseFloat(item.Rate ?? 0);
            if (itSel && itemCode) {
                itSel.innerHTML = '';
                const opt        = document.createElement('option');
                opt.value        = itemCode;
                opt.text         = itemName;
                opt.dataset.rate = rate;
                itSel.appendChild(opt);
                itSel.value = itemCode;
            }

            // ── Rate ─────────────────────────────────────────────────────────
            const rateEl = tr.querySelector('.rate');
            if (rateEl) rateEl.value = rate > 0 ? rate.toFixed(2) : '';

            // ── Pending Qty = QtyMT - MRNQtyMT - CancelQtyMT (from SP) ──────────
            // SP GETPOITEMDETAILS must return: QtyMT, MRNQtyMT, CancelQtyMT OR PendingQty
            const qtyMT       = parseFloat(item.QtyMT       ?? item.qtyMT       ?? 0);
            const mrnQtyMT    = parseFloat(item.MRNQtyMT    ?? item.mrnQtyMT    ?? 0);
            const cancelQtyMT = parseFloat(item.CancelQtyMT ?? item.cancelQtyMT ?? 0);
            const pendingQty  = item.PendingQty ?? item.pendingQty ??
                                (qtyMT > 0 ? Math.max(0, qtyMT - mrnQtyMT - cancelQtyMT) : '');

            // Store on row so onQtyChange can validate against it
            if (pendingQty !== '') tr.dataset.pendingQty = pendingQty;

            const billQtyEl = tr.querySelector('.bill-qty');
            if (billQtyEl && pendingQty !== '') billQtyEl.value = pendingQty;

            calcRowAmount(tr);
        });

        renumberRows();
        updateMobileCards();
        showToast(`${result.length} item(s) loaded for selected project.`, 'success');

    } catch (e) {
        console.error('loadItemsByProject error:', e);
        addItemRow();
        showToast('Failed to load items for project.', 'error');
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// PO LIST HELPERS
// ══════════════════════════════════════════════════════════════════════════════
async function loadAllPOs() {
    try {
        const result = await GRNService.GetPendingPOStoreList();
        poList = result || [];
        refreshAllPODropdowns();
    } catch (e) {
        console.error('Failed to load PO list:', e);
        poList = [];
    }
}

function refreshAllPODropdowns() {
    document.querySelectorAll('#itemTbody tr').forEach(tr => {
        const sel      = tr.querySelector('.po-select');
        if (!sel) return;
        const savedVal = sel.value;
        sel.innerHTML  = '<option value="">Select PO</option>';
        poList.forEach(po => {
            const opt = document.createElement('option');
            opt.value = po.PurchaseOrderMaster_Code ?? po.PurchaseOrder_Code ?? po.Code ?? '';
            opt.text  = po.PoNO ?? po.PO_No ?? po.PONo ?? po.PONumber ?? '';
            sel.appendChild(opt);
        });
        if (savedVal) sel.value = savedVal;
    });
}

// ══════════════════════════════════════════════════════════════════════════════
// ITEM ROW MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════
function addItemRow() {
    rowIndex++;
    const tbody = document.getElementById('itemTbody');
    if (!tbody) return;

    const tr = document.createElement('tr');
    tr.dataset.row = rowIndex;

    tr.innerHTML = `
        <td style="text-align:center;font-weight:700;color:#64748b;font-size:0.78rem;"></td>
        <td>
            <select class="form-control form-control-sm po-select"
                    onchange="onPOChange(this)"
                    onfocus="onPOFocus(this)">
                <option value="">Select PO</option>
            </select>
        </td>
        <td>
            <select class="form-control form-control-sm item-select" onchange="onItemChange(this)">
                <option value="">-- Select Item --</option>
            </select>
        </td>
        <td>
            <input type="number" class="form-control form-control-sm bill-qty"
                   min="0" step="any" placeholder="0"
                   onkeydown="blockNonNumeric(event)"
                   oninput="stripNonNumeric(this); onQtyChange(this)">
        </td>
        <td>
            <input type="number" class="form-control form-control-sm accept-qty"
                   min="0" step="any" placeholder="0"
                   onkeydown="blockNonNumeric(event)"
                   oninput="stripNonNumeric(this); onQtyChange(this)">
        </td>
        <td>
            <input type="number" class="form-control form-control-sm reject-qty"
                   min="0" step="any" placeholder="0"
                   onkeydown="blockNonNumeric(event)"
                   oninput="stripNonNumeric(this); onQtyChange(this)">
        </td>
        <td>
            <input type="number" class="form-control form-control-sm shortage-qty"
                   min="0" step="any" placeholder="0"
                   onkeydown="blockNonNumeric(event)"
                   oninput="stripNonNumeric(this)">
        </td>
        <td>
            <input type="number" class="form-control form-control-sm rate"
                   min="0" step="any" placeholder="0.00"
                   onkeydown="blockNonNumeric(event)"
                   oninput="stripNonNumeric(this); calcRowAmount(this.closest('tr'))">
        </td>
        <td>
            <input type="number" class="form-control form-control-sm amount"
                   readonly placeholder="0.00">
        </td>
        <td>
            <input type="text" class="form-control form-control-sm row-remark" placeholder="Remark">
        </td>
        <td style="text-align:center;">
            <button type="button" class="del-row-btn" onclick="removeItemRow(this)" title="Remove">
                <i class="fa fa-times"></i>
            </button>
        </td>`;

    tbody.appendChild(tr);

    // Fill PO dropdown
    const poSel = tr.querySelector('.po-select');
    poList.forEach(po => {
        const opt = document.createElement('option');
        opt.value = po.PurchaseOrderMaster_Code ?? po.PurchaseOrder_Code ?? po.Code ?? '';
        opt.text  = po.PoNO ?? po.PO_No ?? po.PONo ?? po.PONumber ?? '';
        poSel.appendChild(opt);
    });

    renumberRows();
    updateMobileCards();
    updateFloatBar();
}

function removeItemRow(btn) {
    btn.closest('tr')?.remove();
    renumberRows();
    calcTotal();
    updateMobileCards();
    updateFloatBar();
}

function removeItemRowByIndex(idx) {
    const rows = document.querySelectorAll('#itemTbody tr');
    if (rows[idx]) {
        rows[idx].remove();
        renumberRows();
        calcTotal();
        updateMobileCards();
        updateFloatBar();
    }
}

function renumberRows() {
    document.querySelectorAll('#itemTbody tr').forEach((tr, i) => {
        const cell = tr.cells[0];
        if (cell) cell.textContent = i + 1;
    });
}

// ══════════════════════════════════════════════════════════════════════════════
// Guard — block PO interaction when Against Project is ON but project/sub not selected
function onPOFocus(select) {
    const isAgainstProject = document.getElementById('chkAgainstProject')?.checked;
    if (!isAgainstProject) return;  // toggle OFF → allow

    const projectCode    = document.getElementById('frmDdlProject')?.value;
    const subProjectCode = document.getElementById('frmDdlSubProject')?.value;

    if (!projectCode) {
        showToast('Please select Project Name first.', 'warning');
        select.blur();
        document.getElementById('frmDdlProject')?.focus();
        return;
    }
    if (!subProjectCode) {
        showToast('Please select Sub Project first.', 'warning');
        select.blur();
        document.getElementById('frmDdlSubProject')?.focus();
        return;
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 4 — PO SELECT → reload item dropdown for this row using project+sub
// ══════════════════════════════════════════════════════════════════════════════
async function onPOChange(select) {
    const tr     = select.closest('tr');
    if (!tr) return;
    const poCode = select.value;

    const itemSel = tr.querySelector('.item-select');
    const rateEl  = tr.querySelector('.rate');

    itemSel.innerHTML = '<option value="">-- Select Item --</option>';
    if (rateEl) rateEl.value = '';
    calcRowAmount(tr);

    if (!poCode) return;

    // Read project + sub-project from the page-level selects
    const projectCode    = document.getElementById('frmDdlProject')?.value;
    const subProjectCode = document.getElementById('frmDdlSubProject')?.value;

    // Need both project + sub to call the API
    if (!projectCode || !subProjectCode) {
        showToast('Please select Project and Sub Project first.', 'warning');
        select.value = '';
        return;
    }

    itemSel.innerHTML = '<option value="">Loading…</option>';
    itemSel.disabled  = true;

    try {
        // API now takes ProjectCode + SubProjectMaster_Code (not POCode)
        const result = await GRNService.GetPOItemDetails(projectCode, subProjectCode);
        itemSel.innerHTML = '<option value="">-- Select Item --</option>';
        itemSel.disabled  = false;

        if (result && result.length > 0) {
            // Filter to items matching the selected PO
            // SQL field: PurchaseOrderMaster_Code
            const filtered = result.filter(item => {
                const itemPO = item.PurchaseOrderMaster_Code ?? item.PurchaseOrder_Code ?? '';
                return String(itemPO) === String(poCode);
            });

            const displayList = filtered.length > 0 ? filtered : result;

            displayList.forEach(item => {
                const opt        = document.createElement('option');
                opt.value        = item.ItemMaster_Code ?? item.Item_Code ?? '';   // SQL: ItemMaster_Code
                opt.text         = item.ItemName        ?? item.Item_Name ?? '';   // SQL: ItemName
                opt.dataset.rate = item.Rate            ?? 0;                      // SQL: Rate
                itemSel.appendChild(opt);
            });

            if (displayList.length === 1) {
                itemSel.selectedIndex = 1;
                onItemChange(itemSel);
            }
        } else {
            showToast('No items found for selected project.', 'info');
        }
    } catch (e) {
        itemSel.innerHTML = '<option value="">-- Select Item --</option>';
        itemSel.disabled  = false;
        showToast('Failed to load items.', 'error');
    }
}

// ── Item change → auto-fill rate ────────────────────────────────────────────
function onItemChange(select) {
    const tr   = select.closest('tr');
    if (!tr) return;
    const opt  = select.options[select.selectedIndex];
    const rate = opt?.dataset?.rate ?? '';
    const rateEl = tr.querySelector('.rate');
    if (rateEl) rateEl.value = rate ? parseFloat(rate).toFixed(2) : '';
    calcRowAmount(tr);
    updateMobileCards();
}

// ══════════════════════════════════════════════════════════════════════════════
// VALIDATION: BillQty * Rate = Amount
// ══════════════════════════════════════════════════════════════════════════════
function onQtyChange(input) {
    const tr = input.closest('tr');
    if (!tr) return;

    const pendingQty = tr.dataset.pendingQty !== undefined
                       ? parseFloat(tr.dataset.pendingQty) : null;

    const billQty   = parseFloat(tr.querySelector('.bill-qty')?.value)   || 0;
    const acceptQty = parseFloat(tr.querySelector('.accept-qty')?.value) || 0;
    const rejectQty = parseFloat(tr.querySelector('.reject-qty')?.value) || 0;

    // ── Validate against available pending qty ────────────────────────────────
    if (pendingQty !== null && pendingQty >= 0) {
        if (input.classList.contains('bill-qty') && billQty > pendingQty) {
            showToast(
                `Only ${pendingQty} qty available for this PO. You cannot enter more than ${pendingQty}.`,
                'warning'
            );
            input.value = pendingQty;
            return onQtyChange(input);   // recalc with corrected value
        }
        if (input.classList.contains('accept-qty') && acceptQty > pendingQty) {
            showToast(
                `Only ${pendingQty} qty available for this PO. Accept Qty cannot exceed ${pendingQty}.`,
                'warning'
            );
            input.value = pendingQty;
            return onQtyChange(input);
        }
    }

    // ── Auto-calculate Shortage = BillQty - AcceptQty - RejectQty ────────────
    const shortage   = Math.max(0, billQty - acceptQty - rejectQty);
    const shortageEl = tr.querySelector('.shortage-qty');
    if (shortageEl) shortageEl.value = shortage > 0 ? shortage : 0;

    calcRowAmount(tr);
}

// Amount = BillQty × Rate
function calcRowAmount(tr) {
    const billQty  = parseFloat(tr.querySelector('.bill-qty')?.value) || 0;
    const rate     = parseFloat(tr.querySelector('.rate')?.value)     || 0;
    const amount   = billQty * rate;
    const amountEl = tr.querySelector('.amount');
    if (amountEl) amountEl.value = amount > 0 ? amount.toFixed(2) : '';
    calcTotal();
    updateMobileCards();
}

function calcTotal() {
    let total = 0;
    document.querySelectorAll('#itemTbody tr').forEach(tr => {
        total += parseFloat(tr.querySelector('.amount')?.value) || 0;
    });
    const el = document.getElementById('txtTotalAmount');
    if (el) el.value = total.toFixed(2);
}

// ══════════════════════════════════════════════════════════════════════════════
// GRN LIST VIEW
// ══════════════════════════════════════════════════════════════════════════════
function loadGRNList() {
    GRNService.GetGRNList().then(function (response) {
        var rows = [];
        if (Array.isArray(response)) rows = response;
        else if (Array.isArray(response.data)) rows = response.data;
        else if (Array.isArray(response.Data)) rows = response.Data;
        if (rows.length > 0) {
            $("#grnListTable").show();
            const StringFilterColumn = ["Bill No","Party Name"];
            const NumericFilterColumn = ["MRN No"];
            const DateFilterColumn = ["Bill Date","Receive Date"];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["PartyMaster_Code","Code"];
            const ColumnAlignment = {

                "Action": "center;width:118px;",
            };
            var updatedResponse = rows.map(function (item) {
                var btns =
                    '<button class="im-btn-edit" title="Edit" onclick="editGRN(' + item.Code + ')">' +
                    '<i class="fas fa-pen"></i></button>' +
                    '<button class="im-btn-delete" title="Delete" onclick="confirmDeleteGRN(' + item.Code + ', \'' + (item.GRNo ?? item.MRNNo ?? '') + '\')">' +
                    '<i class="fas fa-trash-can"></i></button>';
                return Object.assign({}, item, { Action: btns });
            });

            BizsolCustomFilterGrid.CreateDataTable(
                "grnListTable-hader", "grnListTbody-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment
            );

        } else {
            toastr.warning("No items found. Add your first item!");
            $("#grnListTable").hide();
        }
    }).catch(function () {
        toastr.error("Failed to load item list.");
    });
}
function formatDate(d) {
    if (!d) return '-';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function toInputDate(val) {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
}

// ══════════════════════════════════════════════════════════════════════════════
// NEW GRN
// ══════════════════════════════════════════════════════════════════════════════
function newGRN() {
    resetForm();
    showFormView();
}

// ══════════════════════════════════════════════════════════════════════════════
// EDIT GRN — load record into form
// ══════════════════════════════════════════════════════════════════════════════
async function editGRN(code) {
    var ModuleName = "GRN Services",
        OptionName = "Edit",
        ShowMsg = "Y",
        FinYear = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(async function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return;
        }
        else {
            if (!code) return;
            showToast('Loading GRN...', 'info');

            try {
                const resp = await GRNService.GetGRNByCode(code);
                if (!resp) { showToast('GRN not found.', 'error'); return; }

                // SP SHOWDATA returns two result sets:
                //   [0] GRNServiceList  → MRNMaster columns + AccountDesp
                //   [1] GRNServiceDetail → MRNDetail columns + ItemName (ItemMaster JOIN) + PONo (PurchaseOrderMaster JOIN)
                const master = (resp.GRNServiceList ?? resp.grnServiceList)?.[0] ?? resp;
                const items = resp.GRNServiceDetail ?? resp.grnServiceDetail ?? [];

                editMode = true;
                editCode = code;

                // In edit mode Add Item is always enabled (no project gate)
                setAddItemBtnState(true);

                // ── Master fields (SP: MRNMaster columns) ────────────────────────────
                const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
                set('txtGRNNo', master.MRNNo ?? '');
                set('txtBillNo', master.BillNo ?? '');
                set('dtBillDate', toInputDate(master.BillDate));
                set('dtRecvDate', toInputDate(master.ReceiveDate));
                set('txtTransporterName', master.TransporterName ?? master.Transporter ?? '');
                set('txtRemark', master.Remarks ?? '');

                // Party dropdown (SP: PartyMaster_Code)
                const ddlParty = document.getElementById('ddlPartyName');
                if (ddlParty) ddlParty.value = master.PartyMaster_Code ?? '';

                // ── Attachment ────────────────────────────────────────────────────────
                // SP SHOWDATA 3rd result set: AttachInfo → AttachFileName + AttachData
                // (from DocumentMaster LEFT JOIN via dynamic SQL in SHOWDATA mode)
                const attachInfo = (resp.AttachInfo ?? resp.attachInfo)?.[0] ?? null;

                existingFileName = attachInfo?.AttachFileName ?? master.AttachFileName ?? '';
                existingImageData = attachInfo?.AttachData ?? master.AttachData ?? [];

                // Reset file input so user can select new file if needed
                const fileInput = document.getElementById('fileAttachment');
                if (fileInput) fileInput.value = '';
                imageBase64Data = [];
                fileName = '';

                const viewBtn = document.getElementById('viewImageBtn');
                if (viewBtn) {
                    if (existingFileName) {
                        viewBtn.style.removeProperty('display');   // remove inline display:none
                        viewBtn.style.display = 'inline-flex';
                        viewBtn.title = existingFileName;
                    } else {
                        viewBtn.style.setProperty('display', 'none', 'important');
                    }
                }

                // ── Detail rows ───────────────────────────────────────────────────────
                document.getElementById('itemTbody').innerHTML = '';
                rowIndex = 0;

                for (const item of items) {
                    addItemRow();
                    const tbody = document.getElementById('itemTbody');
                    const tr = tbody.rows[tbody.rows.length - 1];
                    const poSel = tr.querySelector('.po-select');
                    const itSel = tr.querySelector('.item-select');

                    // PO dropdown
                    // SP returns: PurchaseOrderMaster_Code (MRNDetail) + PONo (LEFT JOIN PurchaseOrderMaster)
                    const poCode = String(item.PurchaseOrderMaster_Code ?? '');
                    const poText = item.PONo ?? item.PoNO ?? poCode;
                    if (poSel && poCode) {
                        if (!poSel.querySelector(`option[value="${poCode}"]`)) {
                            poSel.add(new Option(poText, poCode));
                        }
                        poSel.value = poCode;
                    }

                    // Item dropdown
                    // SP returns: ItemMaster_Code (MRNDetail) + ItemName (LEFT JOIN ItemMaster)
                    const itemCode = String(item.ItemMaster_Code ?? '');
                    const itemName = item.ItemName ?? item.itemName ?? itemCode;
                    if (itSel && itemCode) {
                        itSel.innerHTML = '';
                        const opt = new Option(itemName, itemCode);
                        opt.dataset.rate = item.Rate ?? 0;
                        itSel.add(opt);
                        itSel.value = itemCode;
                    }

                    // Quantity / rate / amount / remark cells
                    // SP columns: QtyBill, RejectedQtyBill, GRNRejectedQty, SortageQty, Rate, Amount, Remarks
                    const setCell = (cls, val) => {
                        const el = tr.querySelector(cls);
                        if (el) el.value = val ?? '';
                    };
                    setCell('.bill-qty', item.QtyBill ?? 0);
                    setCell('.accept-qty', item.RejectedQtyBill ?? 0);
                    setCell('.reject-qty', item.GRNRejectedQty ?? 0);
                    setCell('.shortage-qty', item.SortageQty ?? 0);
                    setCell('.rate', parseFloat(item.Rate ?? 0).toFixed(2));
                    setCell('.amount', parseFloat(item.Amount ?? 0).toFixed(2));
                    setCell('.row-remark', item.Remarks ?? '');
                    calcRowAmount(tr);
                }

                renumberRows();
                document.getElementById('floatModeBadge').textContent = 'EDIT';
                document.getElementById('floatModeBadge').className = 'po-mode-badge badge bg-warning text-dark';
                updateFloatBar();
                showFormView();
                showToast('GRN loaded for editing.', 'success');
            } catch (e) {
                console.error('editGRN error:', e);
                showToast('Failed to load GRN data.', 'error');
            }

        }
    });
}

// ══════════════════════════════════════════════════════════════════════════════
// DELETE GRN
// ══════════════════════════════════════════════════════════════════════════════
function confirmDeleteGRN(code, grnNo) {
    if (!code) return;
    document.getElementById('deleteGRNNoLabel').textContent = grnNo || code;
    document.getElementById('txtDeleteReason').value        = '';
    document.getElementById('btnConfirmDelete').onclick     = () => doDeleteGRN(code);
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    modal.show();
}

async function doDeleteGRN(code) {
    var ModuleName = "GRN Services",
        OptionName = "Delete",
        ShowMsg = "Y",
        FinYear = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(async function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return;
        } else {
            const reason = document.getElementById('txtDeleteReason')?.value?.trim();
            if (!reason) {
                showToast('Please enter reason for delete.', 'warning');
                return;
            }
            try {
                const result = await GRNService.DeleteGRN(code, reason);

                // API returns { Status: "Y", Msg: "...", Code: 0 }
                const isSuccess = result && (
                    result.Status === 'Y' ||
                    result.Status === 'success' ||
                    result.success === true ||
                    result.Success === true
                );

                if (isSuccess) {
                    // Close modal
                    bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'))?.hide();

                    showToast(result.Msg ?? result.msg ?? 'GRN deleted successfully.', 'success');

                    // Reset state and go back to list
                    editMode = false;
                    editCode = 0;
                    await loadGRNList();
                    showListView();
                } else {
                    showToast(result?.Msg ?? result?.msg ?? 'Delete failed.', 'error');
                }
            } catch (e) {
                console.error('doDeleteGRN error:', e);
                showToast('Network error. Please try again.', 'error');
            }
        }
    });
}

// ══════════════════════════════════════════════════════════════════════════════
// FORM VALIDATION
// ══════════════════════════════════════════════════════════════════════════════
function validateGRN() {
  
    const billNo  = document.getElementById('txtBillNo')?.value?.trim();
    const party   = document.getElementById('ddlPartyName')?.value;

   
    if (!billNo) {
        showToast('Please enter Bill No.', 'warning');
        document.getElementById('txtBillNo')?.focus();
        return false;
    }
    if (!party) {
        showToast('Please select Party Name.', 'warning');
        document.getElementById('ddlPartyName')?.focus();
        return false;
    }

    const isAgainstProject = document.getElementById('chkAgainstProject')?.checked;
    if (isAgainstProject) {
        if (!document.getElementById('frmDdlProject')?.value) {
            showToast('Please select Project Name.', 'warning');
            document.getElementById('frmDdlProject')?.focus();
            return false;
        }
        if (!document.getElementById('frmDdlSubProject')?.value) {
            showToast('Please select Sub Project.', 'warning');
            document.getElementById('frmDdlSubProject')?.focus();
            return false;
        }
    }

    const rows = document.querySelectorAll('#itemTbody tr');
    if (rows.length === 0) {
        showToast('Please add at least one item.', 'warning');
        return false;
    }

    // Skip hint row (trProjectHint) — only validate real item rows
    const realRows = Array.from(rows).filter(tr => tr.id !== 'trProjectHint');
    if (realRows.length === 0) {
        showToast('Please add at least one item.', 'warning');
        return false;
    }

    let valid = true;
    realRows.forEach((tr, i) => {
        if (!valid) return;
        const poVal   = tr.querySelector('.po-select')?.value;
        const itemVal = tr.querySelector('.item-select')?.value;
        const billQty = parseFloat(tr.querySelector('.bill-qty')?.value) || 0;
        const rate    = parseFloat(tr.querySelector('.rate')?.value)     || 0;

        if (!poVal) {
            // Instead of "select PO", guide user to select project first
            showToast('Please select Project Name and Sub Project to load PO and items.', 'warning');
            document.getElementById('frmDdlProject')?.focus();
            valid = false;
        } else if (!itemVal) {
            showToast(`Row ${i + 1}: Please select an Item.`, 'warning');
            valid = false;
        } else if (billQty <= 0) {
            showToast(`Row ${i + 1}: Bill Qty must be greater than 0.`, 'warning');
            valid = false;
        } else if (rate <= 0) {
            showToast(`Row ${i + 1}: Rate must be greater than 0.`, 'warning');
            valid = false;
        }
    });
    return valid;
}

// ══════════════════════════════════════════════════════════════════════════════
// SAVE GRN (New + Edit)
// Keys exactly match:  TY_GRNService  /  TY_GRNServiceDetail  /  TY_GRNMasterDetail
// ══════════════════════════════════════════════════════════════════════════════
function saveGRN() {
    var ModuleName = "GRN Services",
        OptionName = "New",
        ShowMsg = "Y",
        FinYear = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(async function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return;
        } else {
            if (!validateGRN()) return;

            // Helper: return date string or fallback date (never send null/empty for NOT NULL date cols)
            const today = new Date().toISOString().split('T')[0];

            const toDateOrFallback = (id, fallbackId) => {
                const v = document.getElementById(id)?.value;
                if (v && v.trim() !== '') return v;
                const fb = fallbackId ? document.getElementById(fallbackId)?.value : null;
                return (fb && fb.trim() !== '') ? fb : today;
            };

            const toDateOrNull = id => {
                const v = document.getElementById(id)?.value;
                return (v && v.trim() !== '') ? v : null;
            };

            // ── GRNServiceDetail — maps to TY_GRNMasterDetail TVP ───────────────────
            // SP TVP columns: Code, MRNMaster_Code, ItemMaster_Code, PurchaseOrderMaster_Code,
            //                 Rate, Amount, SortageQty, GRNRejectedQty, QtyBill, RejectedQtyBill, Remarks
            const GRNServiceDetail = [];
            document.querySelectorAll('#itemTbody tr').forEach(tr => {
                const poSel = tr.querySelector('.po-select');
                const itemSel = tr.querySelector('.item-select');
                GRNServiceDetail.push({
                    Code: 0,                // SP handles via ROW_NUMBER()+@TranCode
                    MRNMaster_Code: 0,                // SP sets via @Code param
                    PurchaseOrderMaster_Code: parseInt(poSel?.value) || 0,
                    ItemMaster_Code: parseInt(itemSel?.value) || 0,
                    QtyBill: parseFloat(tr.querySelector('.bill-qty')?.value) || 0,
                    RejectedQtyBill: parseFloat(tr.querySelector('.accept-qty')?.value) || 0,
                    GRNRejectedQty: parseFloat(tr.querySelector('.reject-qty')?.value) || 0,
                    SortageQty: parseFloat(tr.querySelector('.shortage-qty')?.value) || 0,
                    Rate: parseFloat(tr.querySelector('.rate')?.value) || 0,
                    Amount: parseFloat(tr.querySelector('.amount')?.value) || 0,
                    Remarks: tr.querySelector('.row-remark')?.value || '',
                });
            });

            // ── GRNServiceList — maps to TY_GRNMaster TVP ────────────────────────────
            // SP TVP columns: Code, BillNo, BillDate, ReceiveDate, PartyMaster_Code, TransporterName, Remarks
            const GRNServiceList = [{
                Code: editMode ? editCode : 0,
                BillNo: document.getElementById('txtBillNo')?.value || '',
                BillDate: toDateOrFallback('dtBillDate', 'dtGRNDate'),
                ReceiveDate: toDateOrFallback('dtRecvDate', 'dtGRNDate'),
                PartyMaster_Code: parseInt(document.getElementById('ddlPartyName')?.value) || 0,
                TransporterName: document.getElementById('txtTransporterName')?.value || '',
                Remarks: document.getElementById('txtRemark')?.value || '',
                AttachFileName: fileName || existingFileName || '',
                // Send null when no image — SP param @AttachData IMAGE = NULL handles null safely
                AttachData: imageBase64Data.length > 0
                    ? imageBase64Data
                    : existingImageData.length > 0
                        ? existingImageData
                        : [],
            }];

            const payload = {
                GRNServiceList,    // array of one master record
                GRNServiceDetail,  // array of detail rows
            };

            GRNService.SaveGRN(payload)
                .then(async data => {
                    if (data && (data.Status === 'Y' || data.Status === 'success' || data.success === true || data.Success === true || (data.Code ?? data.code) > 0)) {
                        const newNo = data.grnNo || data.GRNNo || data.EntryNo;
                        if (newNo) {
                            document.getElementById('txtGRNNo').value = newNo;
                            updateFloatBar();
                        }
                        const msg = editMode ? 'GRN updated successfully!' : 'GRN saved successfully!';
                        showToast(msg, 'success');

                        document.getElementById('floatModeBadge').textContent = editMode ? 'UPDATED' : 'SAVED';
                        document.getElementById('floatModeBadge').className = 'po-mode-badge badge bg-primary';

                        editMode = false;
                        editCode = 0;

                        setTimeout(async () => {
                            await loadGRNList();
                            showListView();
                        }, 1200);
                    } else {
                        showToast(data?.message ?? data?.Message ?? 'Save failed.', 'error');
                    }
                })
                .catch(() => showToast('Network error. Please try again.', 'error'));
        }
    });
}

// ══════════════════════════════════════════════════════════════════════════════
// CANCEL / RESET
// ══════════════════════════════════════════════════════════════════════════════
function cancelGRN() {
    resetForm();
    showListView();
}

function resetForm() {
    ['txtGRNNo', 'txtBillNo', 'dtBillDate', 'dtRecvDate', 'txtTransporterName', 'txtRemark']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

    document.getElementById('ddlPartyName').value             = '';
    document.getElementById('fileAttachment').value           = '';
    document.getElementById('chkAgainstProject').checked      = false;
    document.getElementById('divProjectFields').style.display = 'none';
    document.getElementById('frmDdlProject').value            = '';
    document.getElementById('frmDdlSubProject').innerHTML     = '<option value="">-- Select Sub Project --</option>';
    document.getElementById('itemTbody').innerHTML            = '';
    document.getElementById('floatModeBadge').textContent     = 'NEW';
    document.getElementById('floatModeBadge').className       = 'po-mode-badge badge bg-success';

    rowIndex = 0; files = []; fileName = '';
    imageBase64Data = []; existingImageData = []; existingFileName = '';
    editMode = false; editCode = 0;

    document.getElementById('viewImageBtn').style.setProperty('display', 'none', 'important');
    // Show hint for project section on new GRN
    const hint = document.getElementById('divProjectHint');
    if (hint) hint.style.display = 'block';
    // Against Project starts OFF → Add Item enabled, normal empty row
    setAddItemBtnState(true);
    calcTotal();
    setTodayDates();
    addItemRow();
    updateFloatBar();
}

// ══════════════════════════════════════════════════════════════════════════════
// MOBILE CARDS
// ══════════════════════════════════════════════════════════════════════════════
function updateMobileCards() {
    const container = document.getElementById('mobileItemCards');
    const emptyMsg  = document.getElementById('mobileEmptyMsg');
    if (!container) return;

    container.querySelectorAll('.mobile-item-card').forEach(c => c.remove());

    const rows = document.querySelectorAll('#itemTbody tr');
    if (rows.length === 0) {
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
    }
    if (emptyMsg) emptyMsg.style.display = 'none';

    rows.forEach((tr, i) => {
        const poSel    = tr.querySelector('.po-select');
        const itemSel  = tr.querySelector('.item-select');
        const selOpt   = itemSel?.options[itemSel.selectedIndex];
        const poOpt    = poSel?.options[poSel.selectedIndex];

        // Use value check (not selectedIndex > 0) — because loadItemsByProject
        // clears options and adds a single item at index 0 (which fails > 0 check)
        const itemName = (itemSel?.value && selOpt?.text && selOpt.text !== '-- Select Item --')
                            ? selOpt.text
                            : 'New Item';
        const poText   = (poSel?.value && poOpt?.text && poOpt.text !== 'Select PO')
                            ? poOpt.text
                            : '–';

        const card = document.createElement('div');
        card.className = 'mobile-item-card';
        card.innerHTML = `
            <div class="item-card-header">
                <span class="item-card-num">${i + 1}</span>
                <span class="item-card-name">${itemName}</span>
                <div class="item-card-actions">
                    <button type="button" class="item-card-del-btn" onclick="removeItemRowByIndex(${i})">
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="item-card-details">
                <span class="item-card-detail">PO: <b>${poText}</b></span>
                <span class="item-card-detail">Bill Qty: ${tr.querySelector('.bill-qty')?.value   || '0'}</span>
                <span class="item-card-detail">Accept:   ${tr.querySelector('.accept-qty')?.value || '0'}</span>
                <span class="item-card-detail">Reject:   ${tr.querySelector('.reject-qty')?.value || '0'}</span>
                <span class="item-card-detail">Rate:     ${tr.querySelector('.rate')?.value        || '0'}</span>
                <span class="item-card-detail item-card-value">&#8377; ${tr.querySelector('.amount')?.value || '0.00'}</span>
            </div>`;
        container.appendChild(card);
    });
}

// ══════════════════════════════════════════════════════════════════════════════
// FLOAT BAR
// ══════════════════════════════════════════════════════════════════════════════
function updateFloatBar() {
    const grnNo = document.getElementById('txtGRNNo')?.value;
    const pill  = document.getElementById('floatGRNNo');
    if (pill) pill.textContent = grnNo?.trim() || 'New GRN';
}

// ══════════════════════════════════════════════════════════════════════════════
// VIEW ATTACHMENT — lightbox for image / new tab for PDF
// ══════════════════════════════════════════════════════════════════════════════
function viewAttachment() {
    // Priority: newly selected file > existing file from DB
    const data = imageBase64Data.length > 0 ? imageBase64Data : existingImageData;
    const name = fileName || existingFileName || 'attachment';

    if (!data || (Array.isArray(data) && data.length === 0) && typeof data !== 'string') {
        showToast('No attachment to view.', 'info');
        return;
    }

    // Build data-URL from byte-array or base64 string
    let src = '';
    if (typeof data === 'string') {
        src = data.startsWith('data:') ? data : `data:image/jpeg;base64,${data}`;
    } else if (Array.isArray(data) && data.length > 0) {
        const bytes  = new Uint8Array(data);
        let binary   = '';
        bytes.forEach(b => binary += String.fromCharCode(b));
        const b64    = btoa(binary);
        const ext    = name.split('.').pop()?.toLowerCase() || 'jpeg';
        const mime   = ext === 'pdf'
                        ? 'application/pdf'
                        : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        src = `data:${mime};base64,${b64}`;
    }

    if (!src) { showToast('Cannot display attachment.', 'warning'); return; }

    const ext = name.split('.').pop()?.toLowerCase();

    if (ext === 'pdf') {
        // Open PDF in new tab
        const win = window.open('', '_blank');
        win.document.write(
            `<title>${name}</title>
             <style>body{margin:0}</style>
             <iframe src="${src}" style="width:100%;height:100vh;border:none;"></iframe>`
        );
    } else {
        // Image — show in lightbox overlay
        let lb = document.getElementById('grnImgLightbox');
        if (!lb) {
            lb = document.createElement('div');
            lb.id = 'grnImgLightbox';
            lb.style.cssText = `
                position:fixed;inset:0;background:rgba(0,0,0,0.88);
                z-index:99999;display:flex;align-items:center;justify-content:center;
                cursor:pointer;animation:fadeIn .2s ease;`;
            lb.innerHTML = `
                <img id="grnLbImg"
                     style="max-width:90vw;max-height:88vh;border-radius:10px;
                            box-shadow:0 8px 40px rgba(0,0,0,0.6);object-fit:contain;" />
                <div style="position:absolute;top:16px;right:20px;display:flex;gap:8px;">
                    <span id="grnLbName"
                          style="color:#fff;font-size:0.8rem;opacity:0.8;align-self:center;"></span>
                    <button onclick="document.getElementById('grnImgLightbox').style.display='none'"
                            style="background:#fff;border:none;border-radius:50%;
                                   width:34px;height:34px;font-size:1.1rem;
                                   cursor:pointer;line-height:1;">✕</button>
                </div>`;
            lb.onclick = e => { if (e.target === lb) lb.style.display = 'none'; };
            document.body.appendChild(lb);
        }
        document.getElementById('grnLbImg').src  = src;
        document.getElementById('grnLbName').textContent = name;
        lb.style.display = 'flex';
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// FILE UPLOAD
// ══════════════════════════════════════════════════════════════════════════════
function fileUploadChange(event) {
    files    = event.target.files;
    fileName = files?.[0]?.name || '';
    if (files && files.length > 0) {
        convertFileToByteArray(files[0]).then(b => {
            imageBase64Data = b;
            document.getElementById('viewImageBtn').style.setProperty('display', 'flex', 'important');
        });
    } else {
        imageBase64Data = [];
        document.getElementById('viewImageBtn').style.setProperty('display', 'none', 'important');
    }
}

function convertFileToByteArray(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onloadend = e => {
            if (e.target.readyState === FileReader.DONE)
                resolve(Array.from(new Uint8Array(e.target.result)));
        };
        reader.onerror = reject;
    });
}

// ══════════════════════════════════════════════════════════════════════════════
// TOAST NOTIFICATION
// ══════════════════════════════════════════════════════════════════════════════
function showToast(msg, type = 'info') {
    const palette = {
        success: { bg: '#10b981', icon: 'fa-check-circle'         },
        warning: { bg: '#f59e0b', icon: 'fa-exclamation-triangle' },
        error:   { bg: '#ef4444', icon: 'fa-times-circle'         },
        info:    { bg: '#667eea', icon: 'fa-info-circle'          },
    };
    const { bg, icon } = palette[type] || palette.info;
    const toast = document.createElement('div');
    toast.style.cssText = `
        position:fixed;top:20px;right:20px;z-index:9999;
        background:${bg};color:#fff;padding:10px 18px;
        border-radius:10px;font-size:0.85rem;font-weight:600;
        box-shadow:0 4px 16px rgba(0,0,0,0.22);
        display:flex;align-items:center;gap:8px;
        animation:fadeSlideIn 0.3s ease both;`;
    toast.innerHTML = `<i class="fa ${icon}"></i> ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ══════════════════════════════════════════════════════════════════════════════
// SIDEBAR SYNC (float bar margin)
// ══════════════════════════════════════════════════════════════════════════════
(function () {
    const sidebar = document.getElementById('modern-sidebar');
    const bar     = document.getElementById('floatBar');
    if (!sidebar || !bar) return;
    new MutationObserver(syncFloatBarMargin)
        .observe(sidebar, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', syncFloatBarMargin);
})();

// ══════════════════════════════════════════════════════════════════════════════
// EXPOSE TO GLOBAL SCOPE (required for inline onXxx handlers)
// ══════════════════════════════════════════════════════════════════════════════
function getFinancialYear() {
    var d = new Date();
    var month = d.getMonth();
    var year = d.getFullYear();
    if (month < 3) year = year - 1;
    return year + "-" + (year + 1);
}
window.newGRN               = newGRN;
window.editGRN              = editGRN;
window.confirmDeleteGRN     = confirmDeleteGRN;
window.doDeleteGRN          = doDeleteGRN;
window.saveGRN              = saveGRN;
window.cancelGRN            = cancelGRN;
window.addItemRow           = addItemRow;
window.removeItemRow        = removeItemRow;
window.removeItemRowByIndex = removeItemRowByIndex;
window.onQtyChange          = onQtyChange;
window.calcRowAmount        = calcRowAmount;
window.blockNonNumeric      = blockNonNumeric;
window.stripNonNumeric      = stripNonNumeric;
window.onPOFocus            = onPOFocus;
window.onPOChange           = onPOChange;
window.onItemChange         = onItemChange;
window.toggleProjectFields  = toggleProjectFields;
window.loadSubProjects      = loadSubProjects;
window.onSubProjectChange   = onSubProjectChange;
window.loadGRNList          = loadGRNList;
window.fileUploadChange     = fileUploadChange;
window.viewAttachment       = viewAttachment;
