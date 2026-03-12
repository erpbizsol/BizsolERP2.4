import { GRNService }          from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_GRNService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService }          from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';

// ── App-level state ────────────────────────────────────────────────────────
let files           = [];
let fileName        = '';
let imageBase64Data = [];
let existingImageData = [];
let existingFileName  = '';

let rowIndex = 0;
let poList   = [];          // [{Code, PONo, ...}]  loaded once on page open

// ── DOM ready ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    setTodayDates();
    await loadPendingPOs();
    await loadProjectList();
    addItemRow();
    updateFloatBar();
});

// ── Date defaults ──────────────────────────────────────────────────────────
function setTodayDates() {
    const today    = new Date().toISOString().split('T')[0];
    const grnDate  = document.getElementById('dtGRNDate');
    const recvDate = document.getElementById('dtRecvDate');
    if (grnDate  && !grnDate.value)  grnDate.value  = today;
    if (recvDate && !recvDate.value) recvDate.value = today;
}

// ── Load pending PO list (once) ────────────────────────────────────────────
async function loadPendingPOs() {
    try {
        const result = await GRNService.GetPendingPOStoreList();
        poList = result || [];
    } catch (e) {
        console.error('Failed to load PO list:', e);
        poList = [];
    }
}

// ── Load project list ──────────────────────────────────────────────────────
async function loadProjectList() {
    const ddl = document.getElementById('frmDdlProject');
    if (!ddl) return;
    try {
        const result = await GRNService.GetProjectList();
        ddl.innerHTML = '<option value="">-- Select Project --</option>';
        (result || []).forEach(p => {
            const opt   = document.createElement('option');
            opt.value   = p.ProjectMaster_Code ?? p.Code ?? p.projectMaster_Code;
            opt.text    = p.ProjectName         ?? p.Name ?? p.projectName;
            ddl.appendChild(opt);
        });
    } catch (e) {
        console.error('Failed to load projects:', e);
    }
}

// ── Project details toggle ─────────────────────────────────────────────────
function toggleProjectFields(chk) {
    const div = document.getElementById('divProjectFields');
    if (div) div.style.display = chk.checked ? 'block' : 'none';
    if (!chk.checked) {
        document.getElementById('frmDdlProject').value       = '';
        document.getElementById('frmDdlSubProject').innerHTML =
            '<option value="">-- Select Sub Project --</option>';
    }
}

async function loadSubProjects() {
    const projectId = document.getElementById('frmDdlProject')?.value;
    const sub       = document.getElementById('frmDdlSubProject');
    if (!sub) return;
    sub.innerHTML = '<option value="">-- Select Sub Project --</option>';
    if (!projectId) return;
    try {
        const result = await GRNService.GetSubProjectList(projectId);
        (result || []).forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.SubProjectMaster_Code ?? s.Code ?? s.subProjectMaster_Code;
            opt.text  = s.SubProjectName         ?? s.Name ?? s.subProjectName;
            sub.appendChild(opt);
        });
    } catch (e) {
        console.error('Failed to load sub-projects:', e);
    }
}

// ── Item row management ────────────────────────────────────────────────────
function addItemRow() {
    rowIndex++;
    const tbody  = document.getElementById('itemTbody');
    if (!tbody) return;

    const rowNum = tbody.rows.length + 1;
    const tr     = document.createElement('tr');
    tr.dataset.row = rowIndex;

    tr.innerHTML = `
        <td style="text-align:center;font-weight:700;color:#64748b;font-size:0.78rem;">${rowNum}</td>
        <td>
            <select class="form-control form-control-sm po-select" onchange="onPOChange(this)">
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
                   min="0" step="any" placeholder="0" oninput="onQtyChange(this)">
        </td>
        <td>
            <input type="number" class="form-control form-control-sm accept-qty"
                   min="0" step="any" placeholder="0" oninput="onQtyChange(this)">
        </td>
        <td>
            <input type="number" class="form-control form-control-sm reject-qty"
                   min="0" step="any" placeholder="0" oninput="onQtyChange(this)">
        </td>
        <td>
            <input type="number" class="form-control form-control-sm shortage-qty"
                   min="0" step="any" placeholder="0" readonly>
        </td>
        <td>
            <input type="number" class="form-control form-control-sm rate"
                   min="0" step="any" placeholder="0.00" oninput="calcRowAmount(this.closest('tr'))">
        </td>
        <td>
            <input type="number" class="form-control form-control-sm amount"
                   readonly placeholder="0.00">
        </td>
        <td>
            <input type="text" class="form-control form-control-sm row-remark" placeholder="Remark">
        </td>
        <td style="text-align:center;">
            <button type="button" class="del-row-btn" onclick="removeItemRow(this)" title="Remove row">
                <i class="fa fa-times"></i>
            </button>
        </td>`;

    tbody.appendChild(tr);

    // Fill PO dropdown with already-loaded list
    const poSel = tr.querySelector('.po-select');
    poList.forEach(po => {
        const opt = document.createElement('option');
        opt.value = po.PurchaseOrder_Code ?? po.Code ?? po.POCode;
        opt.text  = po.PO_No              ?? po.PONo ?? po.PONumber;
        poSel.appendChild(opt);
    });

    renumberRows();
    updateMobileCards();
    updateFloatBar();
}

function removeItemRow(btn) {
    const tr = btn.closest('tr');
    if (!tr) return;
    tr.remove();
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

// ── PO selection → load items + auto-fill rate ─────────────────────────────
async function onPOChange(select) {
    const tr      = select.closest('tr');
    if (!tr) return;
    const poCode  = select.value;

    const itemSel  = tr.querySelector('.item-select');
    const rateEl   = tr.querySelector('.rate');

    // Reset downstream fields
    itemSel.innerHTML = '<option value="">-- Select Item --</option>';
    if (rateEl) rateEl.value = '';
    calcRowAmount(tr);

    if (!poCode) return;

    itemSel.innerHTML = '<option value="">Loading…</option>';
    itemSel.disabled  = true;

    try {
        const result = await GRNService.GetPOItemDetails(poCode);
        itemSel.innerHTML = '<option value="">-- Select Item --</option>';
        itemSel.disabled  = false;

        if (result && result.length > 0) {
            result.forEach(item => {
                const opt         = document.createElement('option');
                opt.value         = item.Item_Code      ?? item.ItemCode  ?? item.Code;
                opt.text          = item.ItemName       ?? item.Item_Name ?? item.Name;
                opt.dataset.rate  = item.Rate           ?? item.UnitRate  ?? 0;
                itemSel.appendChild(opt);
            });
            // Auto-select & fill if only one item
            if (result.length === 1) {
                itemSel.selectedIndex = 1;
                onItemChange(itemSel);
            }
        } else {
            showToast('No items found for the selected PO.', 'info');
        }
    } catch (e) {
        itemSel.innerHTML = '<option value="">-- Select Item --</option>';
        itemSel.disabled  = false;
        showToast('Failed to load items for PO.', 'error');
    }
}

// ── Item selection → auto-fill rate ───────────────────────────────────────
function onItemChange(select) {
    const tr  = select.closest('tr');
    if (!tr) return;
    const opt  = select.options[select.selectedIndex];
    const rate = opt?.dataset?.rate ?? '';
    const rateEl = tr.querySelector('.rate');
    if (rateEl) rateEl.value = rate ? parseFloat(rate).toFixed(2) : '';
    calcRowAmount(tr);
    updateMobileCards();
}

// ── Quantity & amount calculations ─────────────────────────────────────────
function onQtyChange(input) {
    const tr = input.closest('tr');
    if (!tr) return;

    const billQty   = parseFloat(tr.querySelector('.bill-qty')?.value)   || 0;
    const acceptQty = parseFloat(tr.querySelector('.accept-qty')?.value) || 0;
    const rejectQty = parseFloat(tr.querySelector('.reject-qty')?.value) || 0;

    const shortage   = Math.max(0, billQty - acceptQty - rejectQty);
    const shortageEl = tr.querySelector('.shortage-qty');
    if (shortageEl) shortageEl.value = shortage > 0 ? shortage : '';

    calcRowAmount(tr);
}

function calcRowAmount(tr) {
    const acceptQty = parseFloat(tr.querySelector('.accept-qty')?.value) || 0;
    const rate      = parseFloat(tr.querySelector('.rate')?.value)       || 0;
    const amount    = acceptQty * rate;
    const amountEl  = tr.querySelector('.amount');
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

// ── Mobile item cards ──────────────────────────────────────────────────────
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
        const poSel   = tr.querySelector('.po-select');
        const itemSel = tr.querySelector('.item-select');
        const poVal   = poSel?.options[poSel.selectedIndex]?.text       || '–';
        const itemName = itemSel?.selectedIndex > 0
            ? itemSel.options[itemSel.selectedIndex].text : 'New Item';
        const billQty   = tr.querySelector('.bill-qty')?.value     || '0';
        const acceptQty = tr.querySelector('.accept-qty')?.value   || '0';
        const rejectQty = tr.querySelector('.reject-qty')?.value   || '0';
        const shortage  = tr.querySelector('.shortage-qty')?.value || '0';
        const rate      = tr.querySelector('.rate')?.value         || '0';
        const amount    = tr.querySelector('.amount')?.value       || '0.00';

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
                <span class="item-card-detail">PO: <b>${poVal}</b></span>
                <span class="item-card-detail">Bill: ${billQty}</span>
                <span class="item-card-detail">Accept: ${acceptQty}</span>
                <span class="item-card-detail">Reject: ${rejectQty}</span>
                <span class="item-card-detail">Shortage: ${shortage}</span>
                <span class="item-card-detail">Rate: ${rate}</span>
                <span class="item-card-detail item-card-value">&#8377; ${amount}</span>
            </div>`;
        container.appendChild(card);
    });
}

// ── Floating save bar ──────────────────────────────────────────────────────
function updateFloatBar() {
    const grnNo = document.getElementById('txtGRNNo')?.value;
    const pill  = document.getElementById('floatGRNNo');
    if (pill) pill.textContent = grnNo?.trim() || 'New GRN';
}

// ── File upload ────────────────────────────────────────────────────────────
function fileUploadChange(event) {
    const target = event.target;
    files    = target.files;
    fileName = files?.[0]?.name || '';

    if (files && files.length > 0) {
        convertFileToByteArray(files[0]).then(byteArray => {
            imageBase64Data = byteArray;
            document.getElementById('viewImageBtn')
                    .style.setProperty('display', 'flex', 'important');
        });
    } else {
        imageBase64Data = [];
        document.getElementById('viewImageBtn')
                .style.setProperty('display', 'none', 'important');
    }
}

function convertFileToByteArray(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onloadend = evt => {
            if (evt.target.readyState === FileReader.DONE)
                resolve(Array.from(new Uint8Array(evt.target.result)));
        };
        reader.onerror = reject;
    });
}

// ── Form validation ────────────────────────────────────────────────────────
function validateGRN() {
    const grnDate   = document.getElementById('dtGRNDate')?.value;
    const billNo    = document.getElementById('txtBillNo')?.value?.trim();
    const partyName = document.getElementById('txtPartyName')?.value?.trim();

    if (!grnDate) {
        showToast('Please select GRN Date.', 'warning');
        document.getElementById('dtGRNDate')?.focus();
        return false;
    }
    if (!billNo) {
        showToast('Please enter Bill No.', 'warning');
        document.getElementById('txtBillNo')?.focus();
        return false;
    }
    if (!partyName) {
        showToast('Please enter Party Name.', 'warning');
        document.getElementById('txtPartyName')?.focus();
        return false;
    }

    // Project / Sub-Project mandatory when Against Project is ON
    const isAgainstProject = document.getElementById('chkAgainstProject')?.checked;
    if (isAgainstProject) {
        const projectId    = document.getElementById('frmDdlProject')?.value;
        const subProjectId = document.getElementById('frmDdlSubProject')?.value;
        if (!projectId) {
            showToast('Please select Project Name.', 'warning');
            document.getElementById('frmDdlProject')?.focus();
            return false;
        }
        if (!subProjectId) {
            showToast('Please select Sub Project.', 'warning');
            document.getElementById('frmDdlSubProject')?.focus();
            return false;
        }
    }

    // Item rows
    const rows = document.querySelectorAll('#itemTbody tr');
    if (rows.length === 0) {
        showToast('Please add at least one item.', 'warning');
        return false;
    }

    let rowsValid = true;
    rows.forEach((tr, i) => {
        const poVal   = tr.querySelector('.po-select')?.value;
        const itemVal = tr.querySelector('.item-select')?.value;
        if (!poVal) {
            showToast(`Row ${i + 1}: Please select a PO No.`, 'warning');
            rowsValid = false;
        } else if (!itemVal) {
            showToast(`Row ${i + 1}: Please select an Item.`, 'warning');
            rowsValid = false;
        }
    });
    return rowsValid;
}

// ── Save ───────────────────────────────────────────────────────────────────
function saveGRN() {
    if (!validateGRN()) return;

    const items = [];
    document.querySelectorAll('#itemTbody tr').forEach(tr => {
        const itemSel = tr.querySelector('.item-select');
        items.push({
            poCode:      tr.querySelector('.po-select')?.value    || '',
            itemCode:    itemSel?.value                           || '',
            itemName:    itemSel?.options[itemSel.selectedIndex]?.text || '',
            billQty:     parseFloat(tr.querySelector('.bill-qty')?.value)     || 0,
            acceptQty:   parseFloat(tr.querySelector('.accept-qty')?.value)   || 0,
            rejectQty:   parseFloat(tr.querySelector('.reject-qty')?.value)   || 0,
            shortageQty: parseFloat(tr.querySelector('.shortage-qty')?.value) || 0,
            rate:        parseFloat(tr.querySelector('.rate')?.value)         || 0,
            amount:      parseFloat(tr.querySelector('.amount')?.value)       || 0,
            remark:      tr.querySelector('.row-remark')?.value               || '',
        });
    });

    const authKeyData    = JSON.parse(sessionStorage.getItem('authKey') || '{}');
    const userMasterCode = authKeyData.UserMaster_Code || 0;

    const payload = {
        userMasterCode,
        grnNo:             document.getElementById('txtGRNNo')?.value           || '',
        grnDate:           document.getElementById('dtGRNDate')?.value          || '',
        billNo:            document.getElementById('txtBillNo')?.value          || '',
        billDate:          document.getElementById('dtBillDate')?.value         || '',
        recvDate:          document.getElementById('dtRecvDate')?.value         || '',
        transporterName:   document.getElementById('txtTransporterName')?.value || '',
        partyName:         document.getElementById('txtPartyName')?.value       || '',
        againstProject:    document.getElementById('chkAgainstProject')?.checked || false,
        projectCode:       document.getElementById('frmDdlProject')?.value      || '',
        subProjectCode:    document.getElementById('frmDdlSubProject')?.value   || '',
        totalAmount:       parseFloat(document.getElementById('txtTotalAmount')?.value) || 0,
        remark:            document.getElementById('txtRemark')?.value          || '',
        attachment:        imageBase64Data,
        attachmentFileName: fileName,
        items,
    };

    GRNService.SaveGRN(payload)
        .then(data => {
            if (data && (data.success || data.Success || data.Status === 'success' || (data.Code ?? data.code) > 0)) {
                const newNo = data.grnNo || data.GRNNo || data.EntryNo;
                if (newNo) {
                    document.getElementById('txtGRNNo').value = newNo;
                    updateFloatBar();
                    document.getElementById('floatModeBadge').textContent = 'SAVED';
                    document.getElementById('floatModeBadge').className =
                        'po-mode-badge badge bg-primary';
                }
                showToast('GRN saved successfully!', 'success');
            } else {
                showToast(data?.message || data?.Message || 'Save failed.', 'error');
            }
        })
        .catch(() => showToast('Network error. Please try again.', 'error'));
}

// ── Cancel / reset ─────────────────────────────────────────────────────────
function cancelGRN() {
    if (!confirm('Are you sure you want to cancel? All unsaved data will be lost.')) return;

    ['txtBillNo', 'dtBillDate', 'dtRecvDate', 'txtTransporterName',
     'txtPartyName', 'txtRemark'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    document.getElementById('fileAttachment').value            = '';
    document.getElementById('chkAgainstProject').checked       = false;
    document.getElementById('divProjectFields').style.display  = 'none';
    document.getElementById('frmDdlProject').value             = '';
    document.getElementById('frmDdlSubProject').innerHTML      =
        '<option value="">-- Select Sub Project --</option>';
    document.getElementById('itemTbody').innerHTML             = '';
    document.getElementById('floatModeBadge').textContent      = 'NEW';
    document.getElementById('floatModeBadge').className        = 'po-mode-badge badge bg-success';

    rowIndex        = 0;
    files           = [];
    imageBase64Data = [];
    document.getElementById('viewImageBtn')
            .style.setProperty('display', 'none', 'important');

    calcTotal();
    setTodayDates();
    addItemRow();
    updateFloatBar();
    showToast('Form cleared.', 'info');
}

// ── Toast notification ─────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
    const palette = {
        success: { bg: '#10b981', icon: 'fa-check-circle'          },
        warning: { bg: '#f59e0b', icon: 'fa-exclamation-triangle'  },
        error:   { bg: '#ef4444', icon: 'fa-times-circle'          },
        info:    { bg: '#667eea', icon: 'fa-info-circle'           },
    };
    const { bg, icon } = palette[type] || palette.info;
    const toast = document.createElement('div');
    toast.style.cssText = `
        position:fixed; top:20px; right:20px; z-index:9999;
        background:${bg}; color:#fff; padding:10px 18px;
        border-radius:10px; font-size:0.85rem; font-weight:600;
        box-shadow:0 4px 16px rgba(0,0,0,0.22);
        display:flex; align-items:center; gap:8px;
        animation:fadeSlideIn 0.3s ease both;`;
    toast.innerHTML = `<i class="fa ${icon}"></i> ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ── Expose to global scope (required for inline onXxx handlers) ────────────
window.addItemRow           = addItemRow;
window.removeItemRow        = removeItemRow;
window.removeItemRowByIndex = removeItemRowByIndex;
window.onQtyChange          = onQtyChange;
window.calcRowAmount        = calcRowAmount;
window.onPOChange           = onPOChange;
window.onItemChange         = onItemChange;
window.toggleProjectFields  = toggleProjectFields;
window.loadSubProjects      = loadSubProjects;
window.fileUploadChange     = fileUploadChange;
window.saveGRN              = saveGRN;
window.cancelGRN            = cancelGRN;
