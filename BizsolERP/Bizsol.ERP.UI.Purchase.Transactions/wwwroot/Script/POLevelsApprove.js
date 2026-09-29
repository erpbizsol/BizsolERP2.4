import { POLevelsApproveService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/POLevelsApproveService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

const USE_DUMMY = false;

// ─── DUMMY PO LIST ────────────────────────────────────────────────────────────
const DUMMY_PO_LIST = [
    {
        Code: 1001, 'PO No': 'PO/2025/0112', 'Party Name': 'Tata Steel Limited',
        'PO Date': '2025-07-01', 'Total Bill Amount': 485250.00,
        IsPOAgainstProject: 'Y', ProjectName: 'Solar Plant Phase I', SubProjectName: 'Site A – Bangalore',
        ProjectBudget: 8000000, SubProjectBudget: 2500000,
        ApprovalStatus: 'Pending', CurrentLevelNo: 2, TotalLevels: 3,
        CurrentLevelDesc: 'Finance Manager', LevelCode: 202,
        PaymentTerms: '30 Days Net',
        LevelDetails: [
            { LevelNo: 1, LevelDesc: 'Purchase Head',  ApproverName: 'Rajesh Kumar',  ApprovedOn: '2025-07-02', Remarks: 'Verified and forwarded' },
            { LevelNo: 2, LevelDesc: 'Finance Manager', ApproverName: '', ApprovedOn: '', Remarks: '' },
            { LevelNo: 3, LevelDesc: 'MD Approval',     ApproverName: '', ApprovedOn: '', Remarks: '' }
        ]
    },
    {
        Code: 1002, 'PO No': 'PO/2025/0108', 'Party Name': 'Infosys BPM Ltd',
        'PO Date': '2025-06-28', 'Total Bill Amount': 122500.00,
        ApprovalStatus: 'Pending', CurrentLevelNo: 1, TotalLevels: 2,
        CurrentLevelDesc: 'Purchase Head', LevelCode: 201,
        PaymentTerms: '45 Days',
        LevelDetails: [
            { LevelNo: 1, LevelDesc: 'Purchase Head',  ApproverName: '', ApprovedOn: '', Remarks: '' },
            { LevelNo: 2, LevelDesc: 'Director',        ApproverName: '', ApprovedOn: '', Remarks: '' }
        ]
    },
    {
        Code: 1003, 'PO No': 'PO/2025/0099', 'Party Name': 'Reliance Industries',
        'PO Date': '2025-06-20', 'Total Bill Amount': 890000.00,
        ApprovalStatus: 'Approved', CurrentLevelNo: 3, TotalLevels: 3,
        CurrentLevelDesc: 'MD Approval', LevelCode: 203,
        PaymentTerms: '15 Days',
        LevelDetails: [
            { LevelNo: 1, LevelDesc: 'Purchase Head',  ApproverName: 'Suresh Patel',  ApprovedOn: '2025-06-21', Remarks: 'All docs in order' },
            { LevelNo: 2, LevelDesc: 'Finance Manager', ApproverName: 'Anita Sharma',  ApprovedOn: '2025-06-22', Remarks: 'Budget approved' },
            { LevelNo: 3, LevelDesc: 'MD Approval',     ApproverName: 'Vijay Mehta',   ApprovedOn: '2025-06-23', Remarks: 'Final approval granted' }
        ]
    },
    {
        Code: 1004, 'PO No': 'PO/2025/0095', 'Party Name': 'HCL Technologies Ltd',
        'PO Date': '2025-06-18', 'Total Bill Amount': 234750.00,
        ApprovalStatus: 'Rejected', CurrentLevelNo: 2, TotalLevels: 3,
        CurrentLevelDesc: 'Finance Manager', LevelCode: 202,
        PaymentTerms: '30 Days Net',
        LevelDetails: [
            { LevelNo: 1, LevelDesc: 'Purchase Head',  ApproverName: 'Karan Singh',   ApprovedOn: '2025-06-19', Remarks: 'Forwarded for review' },
            { LevelNo: 2, LevelDesc: 'Finance Manager', ApproverName: 'Priya Nair',    ApprovedOn: '2025-06-20', Remarks: 'Rate too high, needs renegotiation' },
            { LevelNo: 3, LevelDesc: 'MD Approval',     ApproverName: '', ApprovedOn: '', Remarks: '' }
        ]
    },
    {
        Code: 1005, 'PO No': 'PO/2025/0088', 'Party Name': 'Wipro Limited',
        'PO Date': '2025-06-15', 'Total Bill Amount': 678000.00,
        ApprovalStatus: 'Pending', CurrentLevelNo: 1, TotalLevels: 4,
        CurrentLevelDesc: 'Store Manager', LevelCode: 204,
        PaymentTerms: '60 Days',
        LevelDetails: [
            { LevelNo: 1, LevelDesc: 'Store Manager',  ApproverName: '', ApprovedOn: '', Remarks: '' },
            { LevelNo: 2, LevelDesc: 'Purchase Head',  ApproverName: '', ApprovedOn: '', Remarks: '' },
            { LevelNo: 3, LevelDesc: 'Finance Manager', ApproverName: '', ApprovedOn: '', Remarks: '' },
            { LevelNo: 4, LevelDesc: 'MD Approval',     ApproverName: '', ApprovedOn: '', Remarks: '' }
        ]
    },
    {
        Code: 1006, 'PO No': 'PO/2025/0081', 'Party Name': 'Mahindra & Mahindra',
        'PO Date': '2025-06-10', 'Total Bill Amount': 315000.00,
        ApprovalStatus: 'Pending', CurrentLevelNo: 3, TotalLevels: 4,
        CurrentLevelDesc: 'Finance Manager', LevelCode: 203,
        PaymentTerms: '30 Days Net',
        LevelDetails: [
            { LevelNo: 1, LevelDesc: 'Store Manager',  ApproverName: 'Deepak Joshi',  ApprovedOn: '2025-06-11', Remarks: 'Stock requirement confirmed' },
            { LevelNo: 2, LevelDesc: 'Purchase Head',  ApproverName: 'Amit Verma',    ApprovedOn: '2025-06-12', Remarks: 'Vendor verified' },
            { LevelNo: 3, LevelDesc: 'Finance Manager', ApproverName: '', ApprovedOn: '', Remarks: '' },
            { LevelNo: 4, LevelDesc: 'MD Approval',     ApproverName: '', ApprovedOn: '', Remarks: '' }
        ]
    }
];

// ─── DUMMY ITEMS (keyed by PO Code) ──────────────────────────────────────────
const DUMMY_ITEMS = {
    1001: [
        { Product: 'HR Steel Coil 2mm', UOM: 'MT',  'PO Qty': 10,  'Rate After Discount': 52000.00, Amount: 520000.00 },
        { Product: 'MS Flat Bar 50x6',  UOM: 'MT',  'PO Qty': 2,   'Rate After Discount': 58000.00, Amount: 116000.00 },
        { Product: 'Welding Electrode', UOM: 'KG',  'PO Qty': 150, 'Rate After Discount': 120.00,   Amount: 18000.00  }
    ],
    1002: [
        { Product: 'IT Support Services',   UOM: 'HRS', 'PO Qty': 50,  'Rate After Discount': 1500.00, Amount: 75000.00  },
        { Product: 'Annual AMC - Servers',  UOM: 'NOS', 'PO Qty': 5,   'Rate After Discount': 9500.00, Amount: 47500.00  }
    ],
    1003: [
        { Product: 'HDPE Pipe 6 inch',      UOM: 'MTR', 'PO Qty': 200, 'Rate After Discount': 850.00,  Amount: 170000.00 },
        { Product: 'GI Fittings Assorted',  UOM: 'NOS', 'PO Qty': 500, 'Rate After Discount': 85.00,   Amount: 42500.00  },
        { Product: 'Ball Valve 2 inch',     UOM: 'NOS', 'PO Qty': 100, 'Rate After Discount': 620.00,  Amount: 62000.00  },
        { Product: 'PVC Conduit 25mm',      UOM: 'MTR', 'PO Qty': 400, 'Rate After Discount': 48.00,   Amount: 19200.00  }
    ],
    1004: [
        { Product: 'Laptop Core i7 16GB',   UOM: 'NOS', 'PO Qty': 10, 'Rate After Discount': 72000.00, Amount: 720000.00 },
        { Product: 'Optical Mouse',         UOM: 'NOS', 'PO Qty': 10, 'Rate After Discount': 450.00,   Amount: 4500.00   }
    ],
    1005: [
        { Product: 'Hydraulic Oil 68',      UOM: 'LTR', 'PO Qty': 500, 'Rate After Discount': 180.00,  Amount: 90000.00  },
        { Product: 'Grease Cartridge 400g', UOM: 'NOS', 'PO Qty': 200, 'Rate After Discount': 85.00,   Amount: 17000.00  },
        { Product: 'Safety Gloves',         UOM: 'PRS', 'PO Qty': 500, 'Rate After Discount': 45.00,   Amount: 22500.00  }
    ],
    1006: [
        { Product: 'Tractor Parts Kit',     UOM: 'SET', 'PO Qty': 5,   'Rate After Discount': 42000.00, Amount: 210000.00 },
        { Product: 'Engine Oil 20W50',      UOM: 'LTR', 'PO Qty': 100, 'Rate After Discount': 380.00,  Amount: 38000.00  },
        { Product: 'Air Filter Assembly',   UOM: 'NOS', 'PO Qty': 10,  'Rate After Discount': 1200.00, Amount: 12000.00  }
    ]
};

// ─── GLOBAL STATE ─────────────────────────────────────────────────────────────
let G_POList     = [];
let G_CurrentPO  = null;

BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');

// ─── INIT ──────────────────────────────────────────────────────────────────────
$(document).ready(async function () {
    // Ensure dates are initialized before loading the PO list to avoid racing condition
    try {
        await InitDates();
    } catch (e) {
        // continue even if InitDates failed; LoadPOList will handle empty dates
        console.error('InitDates failed', e);
    }

    try {
        await LoadPOList();
    } catch (e) {
        console.error('LoadPOList failed', e);
    }

    $('#lstSearch').on('input', function () {
        FilterCards($(this).val().toLowerCase().trim());
    });

    window.AttachmentControl_onQueueChange = function (count) {
        const n = parseInt(count, 10) || 0;
        const $b = $('#btnModalAttachment');
        if (n > 0) {
            $b.addClass('pla-attach-has-files');
        } else if (!PlaHasAttachmentYes(G_CurrentPO)) {
            $b.removeClass('pla-attach-has-files');
        }
    };

    /** PO Approval cards: refresh after attachments change on a saved PO (green clip / HasAttach). */
    document.addEventListener('bizsol:attachmentcontrol:changed', function (ev) {
        const d = ev.detail;
        if (!d || d.tempMode) return;
        if (d.masterTableName !== 'PurchaseOrderMaster') return;
        if (!document.getElementById('poPendingList')) return;
        LoadPOList();
    });
});

function InitDates() {
    const today = new Date();
    $('#lstToDate').val(FmtDateInput(today));
    if (USE_DUMMY) {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        $('#lstFromDate').val(FmtDateInput(firstDay));
        return Promise.resolve();
    }

    // Request default FromDate from API; fallback to first day of month on error
    return POLevelsApproveService.GetFirstPendingPODate()
        .then(function (resp) {
            // API may return an object { FirstPendingPODate: 'yyyy-MM-dd' } or a plain date string
            let dateStr = '';
            if (!resp) dateStr = '';
            else if (typeof resp === 'string') dateStr = resp;
            else if (resp[0] && resp[0].FirstPendingPODate) dateStr = resp[0].FirstPendingPODate;

            // Try to parse ISO date (yyyy-MM-dd) or other recognized formats
            let d = null;
            if (dateStr) {
                const parsed = new Date(dateStr);
                if (!isNaN(parsed)) d = parsed;
            }

            if (!d) {
                d = new Date(today.getFullYear(), today.getMonth(), 1);
            }
            $('#lstFromDate').val(FmtDateInput(d));
        })
        .catch(function () {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            $('#lstFromDate').val(FmtDateInput(firstDay));
        });
}

function FmtDateInput(d) {
    return d.getFullYear() + '-' +
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0');
}

function FmtDateDisplay(d) {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return String(dt.getDate()).padStart(2, '0') + '/' +
           String(dt.getMonth() + 1).padStart(2, '0') + '/' +
           dt.getFullYear();
}

function FmtApprovedOnDisplay(d) {
    if (!d && d !== 0) return '';
    const s = String(d).trim();
    if (s === '') return '';
    // The approval procedure already returns a pre-formatted 'dd/MM/yyyy HH:mm'
    // string. Showing it as-is keeps the time and avoids ambiguous client-side
    // date parsing that silently drops the time when the day is <= 12.
    if (s.indexOf('/') !== -1) return s;
    const dt = new Date(s);
    if (isNaN(dt.getTime())) return s;
    const pad = function (n) { return String(n).padStart(2, '0'); };
    return pad(dt.getDate()) + '/' + pad(dt.getMonth() + 1) + '/' + dt.getFullYear() +
           ' ' + pad(dt.getHours()) + ':' + pad(dt.getMinutes());
}

function FmtCurrency(val) {
    const n = parseFloat(val);
    if (isNaN(n)) return '—';
    return '\u20B9' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Values for shared PO Store attachment control (EntryNo / EntryDate). */
function PlaRawPONoForAttach(po) {
    if (!po) return '';
    const n = po.PONo || po.PO_No || po['PO No'] || po.PONumber || po.DocNo || '';
    return n;
}

function PlaRawPODateForAttach(po) {
    if (!po) return '';
    const d = po.PODate || po.PO_Date || po['PO Date'] || po.DocDate || '';
    const s = String(d);
    return s.length >= 10 ? s.substring(0, 10) : '';
}

function PlaHasAttachmentYes(po) {
    if (!po) return false;
    const v = po.HasAttach != null ? po.HasAttach
        : po.hasAttach != null ? po.hasAttach
        : po.HasAttachment != null ? po.HasAttachment
        : po['Has Attachment'];
    return String(v || '').trim().toUpperCase() === 'Y';
}

function PlaIsPOAgainstProject(po) {
    if (!po) return false;
    const v = po.IsPOAgainstProject != null ? po.IsPOAgainstProject
        : po.isPOAgainstProject != null ? po.isPOAgainstProject
        : po['Is PO Against Project'];
    return String(v || '').trim().toUpperCase() === 'Y';
}

function PlaProjectName(po) {
    if (!po) return '';
    const n = po.ProjectName != null && String(po.ProjectName).trim() !== '' ? po.ProjectName
        : po['Project Name'] || po.Project || '';
    return String(n || '').trim();
}

function PlaSubProjectName(po) {
    if (!po) return '';
    const n = po.SubProjectName != null && String(po.SubProjectName).trim() !== '' ? po.SubProjectName
        : po['Sub Project Name'] || po.SubProject || '';
    return String(n || '').trim();
}

/** Budget amounts from PO list row only (same payload as GetPendingPOList — no SubProject API). */
function PlaNumericFromPoField(po, keys) {
    if (!po) return null;
    for (let i = 0; i < keys.length; i++) {
        const raw = keys[i] !== undefined ? po[keys[i]] : undefined;
        if (raw == null || raw === '') continue;
        const n = parseFloat(String(raw).replace(/,/g, ''));
        if (!isNaN(n)) return n;
    }
    return null;
}

/** Master project budget on the PO list row */
function PlaProjectBudgetAmt(po) {
    return PlaNumericFromPoField(po, [
        'ProjectBudget', 'projectBudget', 'Project Budget'
    ]);
}

/** Sub-project budget on the PO list row */
function PlaSubProjectBudgetAmt(po) {
    return PlaNumericFromPoField(po, [
        'SubProjectBudget', 'subProjectBudget', 'Sub Project Budget'
    ]);
}

/** Escape for use inside single-quoted JavaScript string in an HTML onclick="..." attribute. */
function PlaEscapeForSingleQuotedJs(s) {
    return String(s)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\r\n/g, '\\n')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\n');
}

function EscHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function PlaNormStatus(status) {
    return String(status || 'Pending').trim().toLowerCase();
}

function PlaIsHoldStatus(status) {
    return PlaNormStatus(status) === 'hold';
}

function PlaIsPendingStatus(status) {
    return PlaNormStatus(status) === 'pending';
}

function PlaNeedsApprovalAction(status) {
    const s = PlaNormStatus(status);
    return s === 'pending' || s === 'hold';
}

function PlaLevelRowIsOnHold(lvlInfo) {
    if (!lvlInfo) return false;
    if (String(lvlInfo.IsOnHold ?? lvlInfo.isOnHold ?? '').trim().toUpperCase() === 'Y') return true;
    const ls = PlaNormStatus(lvlInfo.LevelStatus ?? lvlInfo.Status ?? lvlInfo.ApprovalStatus ?? '');
    return ls === 'hold';
}

function PlaLevelIsOnHold(lvlInfo, poStatus) {
    if (!lvlInfo) return PlaIsHoldStatus(poStatus);
    if (PlaLevelRowIsOnHold(lvlInfo)) return true;
    return PlaIsHoldStatus(poStatus);
}

/** True when PO is on hold or any approval level is marked On Hold — Hold action not allowed again. */
function PlaPOHasAnyLevelOnHold(po) {
    if (!po) return false;
    const status = (po.ApprovalStatus || po.Status || 'Pending').trim();
    if (PlaIsHoldStatus(status)) return true;
    const levels = Array.isArray(po.LevelDetails) ? po.LevelDetails : [];
    for (let i = 0; i < levels.length; i++) {
        if (PlaLevelRowIsOnHold(levels[i])) return true;
    }
    return false;
}

// ─── NORMALIZE API RESPONSE ───────────────────────────────────────────────────
function NormalizePOList(list) {
    return list.map(function (po) {
        // Parse LevelDetails if the API returns it as a JSON string
        if (typeof po.LevelDetails === 'string') {
            try {
                po.LevelDetails = JSON.parse(po.LevelDetails);
            } catch (e) {
                po.LevelDetails = [];
            }
        }
        if (!Array.isArray(po.LevelDetails)) {
            po.LevelDetails = [];
        }
        // Derive TotalLevels from the parsed array when not supplied by API
        if (!po.TotalLevels && po.LevelDetails.length > 0) {
            po.TotalLevels = po.LevelDetails.length;
        }
        return po;
    });
}

// ─── LOAD PO LIST ─────────────────────────────────────────────────────────────
async function LoadPOList() {
    const fromDate = $('#lstFromDate').val() || '';
    const toDate   = $('#lstToDate').val()   || '';
    const status   = $('#lstDdlStatus').val() || '';

    ShowLoading(true);
    ShowEmpty(false);
    document.getElementById('poPendingList').innerHTML = '';

    if (USE_DUMMY) {
        await new Promise(function (res) { setTimeout(res, 600); });
        ShowLoading(false);
        let list = DUMMY_PO_LIST.slice();
        if (status) {
            list = list.filter(function (p) {
                return (p.ApprovalStatus || '').toLowerCase() === status.toLowerCase();
            });
        }
        const search = ($('#lstSearch').val() || '').toLowerCase().trim();
        if (search) {
            list = list.filter(function (p) {
                return (p['PO No'] + ' ' + p['Party Name']).toLowerCase().includes(search);
            });
        }
        G_POList = list;
        UpdateStatChips();
        RenderPOCards(G_POList);
        return;
    }

    try {
        const data = await POLevelsApproveService.GetPendingPOList(fromDate, toDate, status);
        ShowLoading(false);
        G_POList = NormalizePOList(Array.isArray(data) ? data : []);
        UpdateStatChips();
        RenderPOCards(G_POList);
    } catch (err) {
        ShowLoading(false);
        G_POList = [];
        ShowEmpty(true);
        toastr.error('Error loading pending purchase orders.');
        throw err;
    }
}

function UpdateStatChips() {
    const pending  = G_POList.filter(function (p) { return (p.ApprovalStatus || p.Status || 'Pending').toLowerCase() !== 'approved'; }).length;
    const approved = G_POList.length - pending;
    $('#statPendingPO').text(pending > 0 ? pending : (G_POList.length || '—'));
    $('#statApprovedToday').text(approved > 0 ? approved : '—');
}

// ─── RENDER PO CARDS ──────────────────────────────────────────────────────────
function RenderPOCards(list) {
    const container = document.getElementById('poPendingList');
    if (!list || list.length === 0) {
        container.innerHTML = '';
        ShowEmpty(true);
        return;
    }
    ShowEmpty(false);
    container.innerHTML = list.map(function (po) { return BuildPOCard(po); }).join('');
}

function BuildPOCard(po) {
    const poNo     = EscHtml(po['PO No']            || po.PONo        || po.PONumber   || po.DocNo      || '—');
    const vendor   = EscHtml(po['Party Name']        || po.VendorName  || po.Vendor    || po.PartyName  || '—');
    const poDate   = FmtDateDisplay(po['PO Date']    || po.PODate      || po.DocDate);
    const amount   = FmtCurrency(po['Total Bill Amount'] || po.TotalAmount || po.Amount || 0);
    const code     = po.Code || po.PurchaseOrderMaster_Code || 0;
    const totalLvl = parseInt(po.TotalLevels         || po.MaxLevel    || 3);
    const curLvlNo = parseInt(po.CurrentLevelNo      || po.CurrentLevel || 1);
    const lvlDesc  = EscHtml(po.CurrentLevelDesc     || po.LevelDesc   || ('Level ' + curLvlNo));
    const status   = (po.ApprovalStatus              || po.Status      || 'Pending').trim();

    let statusClr, statusBg;
    if (PlaNormStatus(status) === 'approved')      { statusClr = '#059669'; statusBg = '#d1fae5'; }
    else if (PlaNormStatus(status) === 'rejected') { statusClr = '#dc2626'; statusBg = '#fee2e2'; }
    else if (PlaIsHoldStatus(status))              { statusClr = '#ea580c'; statusBg = '#ffedd5'; }
    else                                           { statusClr = '#d97706'; statusBg = '#fef3c7'; }

    const stepperHtml = BuildCardStepper(curLvlNo, totalLvl, status);

    const actionBtn = PlaNeedsApprovalAction(status)
        ? `<button class="btn-pla-card-approve" onclick="OpenDetailModal(${code})">
               <i class="fa fa-check me-1"></i>Review &amp; Approve
           </button>`
        : `<button class="btn-pla-card-view" onclick="OpenDetailModal(${code})">
               <i class="fa fa-eye me-1"></i>View Details
           </button>`;

    const rawPoNoAtt = PlaRawPONoForAttach(po);
    const rawPoDateAtt = PlaRawPODateForAttach(po);
    const escNo = PlaEscapeForSingleQuotedJs(rawPoNoAtt);
    const escDt = PlaEscapeForSingleQuotedJs(rawPoDateAtt);

    const printBtns =
        `<div class="pla-po-card-print-btns">
            <button type="button" class="btn-pla-print-icon btn-pla-print-prev" title="Print Preview" onclick="PrintPO(${code},'preview')">
                <i class="fa fa-search-plus"></i>
            </button>
            <button type="button" class="btn-pla-print-icon btn-pla-print-go" title="Print" onclick="PrintPO(${code},'print')">
                <i class="fa fa-print"></i>
            </button>
            <button type="button" class="btn-pla-print-icon btn-pla-attach-icon" title="Attachments"
                    style="background:${PlaHasAttachmentYes(po) ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#0ea5e9,#0284c7)'};color:#fff;box-shadow:0 2px 8px rgba(14,165,233,0.35);"
                    onclick="OpenPOApprovalAttachment(${code}, '${escNo}', '${escDt}')">
                <i class="fa fa-paperclip"></i>
            </button>
        </div>`;

    let dataSearchKey = ((po['Party Name'] || po.VendorName || po.Vendor || po.PartyName || '') + ' ' +
        (po['PO No'] || po.PONo || po.PONumber || po.DocNo || '')).toLowerCase();
    if (PlaIsPOAgainstProject(po)) {
        dataSearchKey += ' ' + PlaProjectName(po).toLowerCase() + ' ' + PlaSubProjectName(po).toLowerCase();
    }

    const projBudAmt = PlaProjectBudgetAmt(po);
    const subBudAmt  = PlaSubProjectBudgetAmt(po);
    if (projBudAmt != null) dataSearchKey += ' ' + String(projBudAmt);
    if (subBudAmt != null) dataSearchKey += ' ' + String(subBudAmt);

    let projBudgetLine = '';
    if (PlaIsPOAgainstProject(po) && (projBudAmt != null || subBudAmt != null)) {
        const pb = projBudAmt != null ? FmtCurrency(projBudAmt) : '—';
        const sb = subBudAmt != null ? FmtCurrency(subBudAmt) : '—';
        projBudgetLine =
            '<div class="pla-po-card-proj-bud" style="font-size:0.66rem;color:#64748b;margin-top:3px;line-height:1.3;font-weight:600;">' +
            '<span>Proj budget: ' + pb + '</span> <span style="color:#cbd5e1;">·</span> ' +
            '<span>Sub budget: ' + sb + '</span></div>';
    }

    const projLine = PlaIsPOAgainstProject(po)
        ? ('<div class="pla-po-card-proj" style="font-size:0.7rem;color:#64748b;margin-top:4px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;" title="' +
            EscHtml((PlaProjectName(po) || '—') + (PlaSubProjectName(po) ? ' / ' + PlaSubProjectName(po) : '')) + '">' +
            '<i class="fa fa-diagram-project me-1" style="color:#667eea;font-size:0.68rem;"></i>' +
            EscHtml(PlaProjectName(po) || '—') +
            (PlaSubProjectName(po) ? ' <span style="color:#94a3b8;">·</span> ' + EscHtml(PlaSubProjectName(po)) : '') +
            '</div>' + projBudgetLine)
        : '';

    return `
    <div class="pla-po-card section-entry-animation" data-code="${code}" data-search="${EscHtml(dataSearchKey)}">
        <div class="pla-po-card-header">
            <div class="pla-po-no-badge">
                <span style="font-size:0.6rem;font-weight:600;opacity:0.82;line-height:1;">PO#</span>
                <span style="font-weight:800;font-size:0.82rem;line-height:1.2;">${poNo}</span>
            </div>
            <div class="pla-po-card-vendor">
                <div class="pla-po-vendor-name">
                    <i class="fa fa-building me-1" style="color:#667eea;font-size:0.72rem;"></i>${vendor}
                </div>
                <div class="pla-po-card-meta">
                    <span><i class="fa fa-calendar-alt me-1"></i>${poDate || '—'}</span>
                    <span class="pla-po-level-chip">
                        <i class="fa fa-layer-group me-1"></i>${lvlDesc}
                    </span>
                </div>
                ${projLine}
            </div>
            <div class="pla-po-card-right">
                <div class="pla-po-amount">${amount}</div>
                <div class="pla-po-status-badge" style="color:${statusClr};background:${statusBg};">${EscHtml(status)}</div>
            </div>
        </div>
        <div class="pla-po-card-levels">
            <div class="pla-po-level-label">
                <i class="fa fa-code-branch me-1" style="color:#667eea;"></i>
                Approval Progress
            </div>
            ${stepperHtml}
        </div>
        <div class="pla-po-card-footer">
            ${printBtns}
            ${actionBtn}
        </div>
    </div>`;
}

function BuildCardStepper(currentLevel, totalLevels, status) {
    if (!totalLevels || totalLevels < 1) totalLevels = 1;
    const st = PlaNormStatus(status);
    let html = '<div class="pla-stepper">';
    for (let i = 1; i <= totalLevels; i++) {
        let stepClass;
        if (st === 'approved')                        { stepClass = 'pla-step-done'; }
        else if (i < currentLevel)                    { stepClass = 'pla-step-done'; }
        else if (i === currentLevel && st === 'hold') { stepClass = 'pla-step-hold'; }
        else if (i === currentLevel)                  { stepClass = st === 'rejected' ? 'pla-step-rejected' : 'pla-step-active'; }
        else                                          { stepClass = 'pla-step-pending'; }

        const lineClass = (i < currentLevel || st === 'approved')
            ? 'pla-step-line-done' : 'pla-step-line-pending';

        const iconHtml = stepClass === 'pla-step-done'
            ? '<i class="fa fa-check" style="font-size:0.6rem;"></i>'
            : stepClass === 'pla-step-rejected'
                ? '<i class="fa fa-times" style="font-size:0.6rem;"></i>'
                : stepClass === 'pla-step-hold'
                    ? '<i class="fa fa-pause" style="font-size:0.6rem;"></i>'
                : i;

        html += `<div class="pla-step-item">
                    <div class="pla-step-circle ${stepClass}">${iconHtml}</div>
                    <div class="pla-step-lbl">L${i}</div>
                 </div>`;
        if (i < totalLevels) {
            html += `<div class="pla-step-connector ${lineClass}"></div>`;
        }
    }
    html += '</div>';
    return html;
}

// ─── FILTER CARDS ──────────────────────────────────────────────────────────────
function FilterCards(query) {
    const cards   = document.querySelectorAll('.pla-po-card');
    let   visible = 0;
    cards.forEach(function (card) {
        const match = !query || (card.dataset.search || '').includes(query);
        card.style.display = match ? '' : 'none';
        if (match) visible++;
    });
    ShowEmpty(visible === 0 && G_POList.length > 0);
}

// ─── OPEN DETAIL MODAL ─────────────────────────────────────────────────────────
function OpenDetailModal(poCode) {
  
            G_CurrentPO = G_POList.find(function (p) {
                return (p.Code || p.PurchaseOrderMaster_Code || 0) == poCode;
            });
            if (!G_CurrentPO) return;

            const poNo = G_CurrentPO['PO No'] || G_CurrentPO.PONo || '—';
            const vendor = G_CurrentPO['Party Name'] || G_CurrentPO.VendorName || '—';
            const poDate = FmtDateDisplay(G_CurrentPO['PO Date'] || G_CurrentPO.PODate);
            const amount = FmtCurrency(G_CurrentPO['Total Bill Amount'] || G_CurrentPO.TotalAmount || 0);
            const curLvlNo = parseInt(G_CurrentPO.CurrentLevelNo || G_CurrentPO.CurrentLevel || 1);
            const totalLvl = parseInt(G_CurrentPO.TotalLevels || G_CurrentPO.MaxLevel || 3);
            const pmtTerms = G_CurrentPO.PaymentTerms || G_CurrentPO['Payment Terms'] || '—';
            const status = (G_CurrentPO.ApprovalStatus || G_CurrentPO.Status || 'Pending').trim();

            $('#modalPONo').text('PO# ' + poNo);
            $('#modalVendorName').text(vendor);
            $('#hfPOCode').val(poCode);
            $('#hfLevelCode').val(G_CurrentPO.LevelCode || G_CurrentPO.ApprovalLevel_Code || 0);
            $('#hfAttachPONo').val(String(PlaRawPONoForAttach(G_CurrentPO) || ''));
            $('#hfAttachPODate').val(PlaRawPODateForAttach(G_CurrentPO) || '');
            $('#btnModalAttachment').toggleClass('pla-attach-has-files', PlaHasAttachmentYes(G_CurrentPO));
            $('#frmRemarks').val('');

            // PO header info grid
            let headerHtml = '<div class="pla-info-grid">' +
                BuildInfoItem('PO Number', EscHtml(poNo), 'fa-file-invoice') +
                BuildInfoItem('Vendor', EscHtml(vendor), 'fa-building') +
                BuildInfoItem('PO Date', EscHtml(poDate || '—'), 'fa-calendar-alt');
            if (PlaIsPOAgainstProject(G_CurrentPO)) {
                const proj = PlaProjectName(G_CurrentPO);
                const subp = PlaSubProjectName(G_CurrentPO);
                headerHtml += BuildInfoItem('Project', proj ? EscHtml(proj) : '—', 'fa-diagram-project');
                headerHtml += BuildInfoItem('Sub Project', subp ? EscHtml(subp) : '—', 'fa-map-location-dot');
                const mb = PlaProjectBudgetAmt(G_CurrentPO);
                const sb = PlaSubProjectBudgetAmt(G_CurrentPO);
                if (mb != null || sb != null) {
                    headerHtml += BuildInfoItem('Project budget', mb != null ? EscHtml(FmtCurrency(mb)) : '—', 'fa-sack-dollar');
                    headerHtml += BuildInfoItem('Sub-project budget', sb != null ? EscHtml(FmtCurrency(sb)) : '—', 'fa-coins');
                }
            }
            headerHtml += BuildInfoItem('Total Amount', amount, 'fa-rupee-sign', '#667eea') +
                BuildInfoItem('Current Level', 'Level ' + curLvlNo + ' of ' + totalLvl, 'fa-layer-group') +
                BuildInfoItem('Status', EscHtml(status), 'fa-info-circle') +
                '</div>';
            $('#modalPOHeader').html(headerHtml);

            // Approval level stepper
            $('#modalApprovalStepper').html(BuildDetailStepper(G_CurrentPO));

            // Show/hide approve, reject & hold buttons
            const needsAction = PlaNeedsApprovalAction(status);
            const holdBlocked = PlaPOHasAnyLevelOnHold(G_CurrentPO);
            $('#btnApproveAction').toggle(needsAction);
            $('#btnRejectAction').toggle(needsAction);
            $('#btnHoldAction').toggle(needsAction);
            $('#btnHoldAction')
                .prop('disabled', holdBlocked)
                .toggleClass('pla-btn-hold-disabled', holdBlocked)
                .attr('title', holdBlocked ? 'This PO is already on hold at an approval level.' : 'Put on hold');

            // Items placeholder
            $('#modalItemsBody').html(
                '<tr><td colspan="6" class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">' +
                '<i class="fa fa-spinner fa-spin me-1"></i>Loading items\u2026</td></tr>'
            );

            $('#modalPODetail').modal({ backdrop: 'static' });
            $('#modalPODetail').modal('show');

            // Load items async
            if (USE_DUMMY) {
                setTimeout(function () {
                    RenderModalItems(DUMMY_ITEMS[poCode] || []);
                }, 400);
                return;
            }

            POLevelsApproveService.GetPOItems(poCode)
                .then(function (items) { RenderModalItems(items); })
                .catch(function () {
                    $('#modalItemsBody').html(
                        '<tr><td colspan="6" class="text-center py-3" style="color:#ef4444;font-size:0.82rem;">' +
                        '<i class="fa fa-exclamation-triangle me-1"></i>Error loading items.</td></tr>'
                    );
                });
      
   
}

function BuildInfoItem(label, value, icon, valueColor) {
    const clr = valueColor ? 'style="color:' + valueColor + ';font-weight:800;"' : '';
    return '<div class="pla-info-item">' +
               '<span class="pla-info-lbl"><i class="fa ' + icon + ' me-1"></i>' + label + '</span>' +
               '<span class="pla-info-val" ' + clr + '>' + value + '</span>' +
           '</div>';
}

function BuildDetailStepper(po) {
    const curLvlNo = parseInt(po.CurrentLevelNo  || po.CurrentLevel || 1);
    const totalLvl = parseInt(po.TotalLevels     || po.MaxLevel      || 3);
    const status   = (po.ApprovalStatus || po.Status || 'Pending').trim();
    const levels   = Array.isArray(po.LevelDetails) ? po.LevelDetails : [];

    let html = '<div class="pla-detail-stepper">';
    for (let i = 1; i <= totalLvl; i++) {
        const lvlInfo    = levels.find(function (l) { return (l.LevelNo || l.Level || l.LevelOrder) == i; }) || {};
        const lvlName    = EscHtml(lvlInfo.LevelDesc || lvlInfo.LevelName || ('Level ' + i));
        const approver   = EscHtml(lvlInfo.ApproverName || lvlInfo.UserName || '');
        const approvedOn = lvlInfo.ApprovedOn ? FmtApprovedOnDisplay(lvlInfo.ApprovedOn) : '';
        const remarks    = EscHtml(lvlInfo.Remarks || lvlInfo.Remark || '');

        let stepState;
        if (PlaNormStatus(status) === 'approved' || i < curLvlNo) stepState = 'done';
        else if (PlaLevelRowIsOnHold(lvlInfo) || (i === curLvlNo && PlaIsHoldStatus(status))) stepState = 'hold';
        else if (i === curLvlNo) stepState = PlaNormStatus(status) === 'rejected' ? 'rejected' : 'active';
        else stepState = 'pending';

        const iconHtml = stepState === 'done'     ? '<i class="fa fa-check"></i>'
                       : stepState === 'rejected' ? '<i class="fa fa-times"></i>'
                       : stepState === 'hold'     ? '<i class="fa fa-pause"></i>'
                       : stepState === 'active'   ? '<i class="fa fa-hourglass-half"></i>'
                       : i;

        const badgeLabel = stepState === 'done'     ? 'Approved'
                         : stepState === 'rejected' ? 'Rejected'
                         : stepState === 'hold'     ? 'On Hold'
                         : stepState === 'active'   ? 'Pending'
                         : 'Waiting';

        const approverHtml = approver
            ? '<div class="pla-dstep-sub"><i class="fa fa-user me-1"></i>' + approver +
              (approvedOn ? ' &mdash; ' + approvedOn : '') + '</div>'
            : '';

        const remarksHtml = remarks
            ? '<div class="pla-dstep-remarks"><i class="fa fa-comment me-1"></i>' + remarks + '</div>'
            : '';

        const lineClass = (stepState === 'done') ? 'pla-dstep-line-done' : 'pla-dstep-line-pending';

        html += '<div class="pla-dstep-item pla-dstep-' + stepState + '">' +
                    '<div class="pla-dstep-circle">' + iconHtml + '</div>' +
                    '<div class="pla-dstep-body">' +
                        '<div class="pla-dstep-title">' + lvlName + '</div>' +
                        approverHtml +
                        remarksHtml +
                        '<div class="pla-dstep-badge pla-dstep-badge-' + stepState + '">' + badgeLabel + '</div>' +
                    '</div>' +
                '</div>';

        if (i < totalLvl) {
            html += '<div class="pla-dstep-line ' + lineClass + '"></div>';
        }
    }
    html += '</div>';
    return html;
}

function RenderModalItems(items) {
    if (!items || items.length === 0) {
        $('#modalItemsBody').html(
            '<tr><td colspan="6" class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">No items found.</td></tr>'
        );
        return;
    }
    let html = '';
    items.forEach(function (item, idx) {
        const name  = EscHtml(item['Product'] || item.ItemName || item.Item || item.ItemDescription || '—');
        const uom   = EscHtml(item['UOM']     || item.UomName  || '—');
        const qty   = parseFloat(item['PO Qty']  || item.Qty   || item.Quantity || 0);
        const rate  = parseFloat(item['Rate After Discount'] || item.Rate || 0);
        const amt   = parseFloat(item['Amount']  || item.Amount || 0);
        html += '<tr>' +
                    '<td class="text-center" style="color:#94a3b8;">' + (idx + 1) + '</td>' +
                    '<td style="font-weight:600;">' + name + '</td>' +
                    '<td class="text-center">' + uom + '</td>' +
                    '<td class="text-end">' + qty.toLocaleString('en-IN') + '</td>' +
                    '<td class="text-end">' + rate.toLocaleString('en-IN', { minimumFractionDigits: 2 }) + '</td>' +
                    '<td class="text-end" style="font-weight:700;color:#667eea;">' + FmtCurrency(amt) + '</td>' +
                '</tr>';
    });
    $('#modalItemsBody').html(html);
}

// ─── SUBMIT APPROVAL ──────────────────────────────────────────────────────────
function SubmitApproval(action) {
    const poCode    = parseInt($('#hfPOCode').val()    || '0', 10);
    const levelCode = parseInt($('#hfLevelCode').val() || '0', 10);
    const remarks   = ($('#frmRemarks').val() || '').trim();

    if (!poCode) { toastr.warning('No PO selected.'); return; }
    if (action === 'Hold' && PlaPOHasAnyLevelOnHold(G_CurrentPO)) {
        toastr.warning('This PO is already on hold at an approval level.');
        return;
    }
    if ((action === 'Reject' || action === 'Hold') && !remarks) {
        toastr.warning('Please enter remarks before ' + action.toLowerCase() + 'ing.');
        $('#frmRemarks').focus();
        return;
    }

    const poNo   = G_CurrentPO ? (G_CurrentPO['PO No'] || G_CurrentPO.PONo || '') : '';
    const isAppr = action === 'Approve';
    const isHold = action === 'Hold';
    const hdrBg  = isAppr
        ? 'background:linear-gradient(135deg,#059669,#10b981);color:#fff;'
        : isHold
            ? 'background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;'
            : 'background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;';
    const btnCls = isAppr ? 'btn-pla-confirm-approve' : (isHold ? 'btn-pla-confirm-hold' : 'btn-pla-confirm-reject');
    const btnTxt = isAppr
        ? '<i class="fa fa-check me-1"></i>Yes, Approve'
        : isHold
            ? '<i class="fa fa-pause me-1"></i>Yes, Hold'
            : '<i class="fa fa-times me-1"></i>Yes, Reject';
    const msg = isAppr
        ? 'Are you sure you want to <strong>approve</strong> PO# <strong>' + EscHtml(poNo) + '</strong>?'
        : isHold
            ? 'Are you sure you want to put PO# <strong>' + EscHtml(poNo) + '</strong> on <strong>hold</strong>?'
            : 'Are you sure you want to <strong>reject</strong> PO# <strong>' + EscHtml(poNo) + '</strong>?';

    $('#confirmTitle').text(isAppr ? 'Confirm Approval' : (isHold ? 'Confirm Hold' : 'Confirm Rejection'));
    $('#confirmModalHeader').attr('style', 'padding:12px 16px;border:none;' + hdrBg);
    $('#confirmMessage').html(msg);
    $('#btnConfirmAction')
        .attr('class', btnCls)
        .html(btnTxt)
        .off('click')
        .on('click', function () { ExecuteApproval(poCode, levelCode, remarks, action); });

    $('#modalConfirm').modal('show');
}

function ExecuteApproval(poCode, levelCode, remarks, action) {
    CloseConfirmModal();

    if (USE_DUMMY) {
        Showloader();
        setTimeout(function () {
            HideLoader();
            toastr.success('PO ' + (action === 'Approve' ? 'approved' : 'rejected') + ' successfully. (Demo)');
            CloseDetailModal();
            // Update dummy list status for visual feedback
            const po = G_POList.find(function (p) { return (p.Code || 0) == poCode; });
            if (po) po.ApprovalStatus = action === 'Approve' ? 'Approved' : 'Rejected';
            RenderPOCards(G_POList);
            UpdateStatChips();
        }, 700);
        return;
    }

    Showloader();

    const serviceCall = action === 'Approve'
        ? POLevelsApproveService.ApprovePO(poCode, levelCode, remarks)
        : action === 'Hold'
            ? POLevelsApproveService.HoldPO(poCode, levelCode, remarks)
            : POLevelsApproveService.RejectPO(poCode, levelCode, remarks);

    const successVerb = action === 'Approve' ? 'approved' : (action === 'Hold' ? 'put on hold' : 'rejected');
    const failVerb = action === 'Approve' ? 'approving' : (action === 'Hold' ? 'holding' : 'rejecting');

    serviceCall
        .then(function (response) {
            HideLoader();
            const ok = response && (
                response.Status === 'Y' || response.Status === 'Success' ||
                response.Success === true || response === true
            );
            if (ok) {
                toastr.success('PO ' + successVerb + ' successfully.');
                CloseDetailModal();
                LoadPOList();
            } else {
                const msg = (response && (response.Msg || response.Message || response.message)) ||
                            ('Failed to ' + action.toLowerCase() + ' PO.');
                toastr.error(msg);
            }
        })
        .catch(function () {
            HideLoader();
            toastr.error('Error while ' + failVerb + ' PO.');
        });
}

// ─── MODAL HELPERS ────────────────────────────────────────────────────────────
function CloseDetailModal() {
    $('#modalPODetail').modal('hide');
    G_CurrentPO = null;
}

function CloseConfirmModal() {
    $('#modalConfirm').modal('hide');
}

function CloseBudgetHistoryModal() {
    $('#modalPOBudgetHistory').modal('hide');
}

function plaPickHistoryField(row, keys) {
    if (!row) return '';
    for (let i = 0; i < keys.length; i++) {
        if (row[keys[i]] !== undefined && row[keys[i]] !== null && String(row[keys[i]]).trim() !== '') {
            return row[keys[i]];
        }
    }
    const objKeys = Object.keys(row);
    for (let i = 0; i < keys.length; i++) {
        const want = String(keys[i]).toLowerCase().replace(/\s+/g, '');
        const found = objKeys.find(function (k) {
            return String(k).toLowerCase().replace(/\s+/g, '') === want;
        });
        if (found != null && row[found] !== undefined && row[found] !== null && String(row[found]).trim() !== '') {
            return row[found];
        }
    }
    return '';
}

function plaFmtHistoryAmt(val) {
    const n = parseFloat(String(val == null ? '' : val).replace(/,/g, ''));
    if (isNaN(n)) return '0.00';
    return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function NormalizeBudgetHistoryList(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.Data)) return data.Data;
    if (Array.isArray(data.History)) return data.History;
    return [];
}

function RenderBudgetHistoryRows(rows) {
    const $body = $('#budgetHistoryBody');
    if (!rows || rows.length === 0) {
        $body.html(
            '<tr><td colspan="7" class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">' +
            'No budget history found for this PO.</td></tr>'
        );
        return;
    }

    let html = '';
    rows.forEach(function (row) {
        const category = EscHtml(plaPickHistoryField(row, ['Category', 'BOS Type', 'BOS Tyep', 'CategoryName']) || '—');
        const item = EscHtml(plaPickHistoryField(row, ['Item', 'Item Name', 'ItemName']) || '');
        const budget = plaPickHistoryField(row, ['Budget Amount with GST', '(A) Total Budget Amt With Gst', 'BudgetAmtWithGst']);
        const current = plaPickHistoryField(row, ['Current po amt with GST', '(B) Current PO/WO Amt With Gst', 'CurrentPOAmtWithGst']);
        const other = plaPickHistoryField(row, ['Other PO sum value with GST', '(C )Old WO/PO Amt With Gst', 'OtherPOAmtWithGst']);
        const net = plaPickHistoryField(row, ['Net PO amount', '(D)Net WO/PO Amt With GST', 'NetPOAmount']);
        const balance = plaPickHistoryField(row, ['Balance', '(A) - (D)Balance Budget Amt', 'BalanceAmt']);
        const balNum = parseFloat(String(balance == null ? '' : balance).replace(/,/g, ''));
        const balCls = !isNaN(balNum) && balNum < 0 ? 'pla-history-neg' : 'pla-history-pos';

        html += '<tr>' +
            '<td class="text-center" style="font-weight:700;">' + category + '</td>' +
            '<td style="font-weight:600;">' + (item || '<span style="color:#94a3b8;">—</span>') + '</td>' +
            '<td class="text-end">' + plaFmtHistoryAmt(budget) + '</td>' +
            '<td class="text-end">' + plaFmtHistoryAmt(current) + '</td>' +
            '<td class="text-end">' + plaFmtHistoryAmt(other) + '</td>' +
            '<td class="text-end" style="font-weight:700;">' + plaFmtHistoryAmt(net) + '</td>' +
            '<td class="text-end ' + balCls + '">' + plaFmtHistoryAmt(balance) + '</td>' +
            '</tr>';
    });
    $body.html(html);
}

function OpenBudgetHistoryModal() {
    const poCode = parseInt($('#hfPOCode').val() || '0', 10);
    if (!poCode) {
        toastr.warning('No PO selected.');
        return;
    }

    const poNo = G_CurrentPO ? (G_CurrentPO['PO No'] || G_CurrentPO.PONo || '') : '';
    const vendor = G_CurrentPO ? (G_CurrentPO['Party Name'] || G_CurrentPO.VendorName || '') : '';
    const project = PlaProjectName(G_CurrentPO) || '—';
    const subProject = PlaSubProjectName(G_CurrentPO) || '—';

    $('#budgetHistoryModalSub').text(
        (poNo ? ('PO# ' + poNo) : 'As per budget amount') + (vendor ? (' · ' + vendor) : '')
    );
    $('#budgetHistoryProjectLine').html(
        '<i class="fa fa-diagram-project me-1"></i>Project: ' + EscHtml(project) +
        '&nbsp;&nbsp;|&nbsp;&nbsp;' +
        '<i class="fa fa-map-location-dot me-1"></i>Sub Project: ' + EscHtml(subProject)
    );
    $('#budgetHistoryBody').html(
        '<tr><td colspan="7" class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">' +
        '<i class="fa fa-spinner fa-spin me-1"></i>Loading history…</td></tr>'
    );

    $('#modalPOBudgetHistory').modal({ backdrop: 'static' });
    $('#modalPOBudgetHistory').modal('show');

    if (USE_DUMMY) {
        RenderBudgetHistoryRows([
            {
                Category: 'A', Item: 'module',
                'Budget Amount with GST': 100000,
                'Current po amt with GST': 20000,
                'Other PO sum value with GST': 30000,
                'Net PO amount': 50000,
                Balance: 50000
            },
            {
                Category: 'B', Item: 'Inventor',
                'Budget Amount with GST': 100000,
                'Current po amt with GST': 30000,
                'Other PO sum value with GST': 40000,
                'Net PO amount': 70000,
                Balance: 30000
            },
            {
                Category: 'C', Item: '',
                'Budget Amount with GST': 100000,
                'Current po amt with GST': 40000,
                'Other PO sum value with GST': 20000,
                'Net PO amount': 60000,
                Balance: 40000
            }
        ]);
        return;
    }

    POLevelsApproveService.GetBudgetHistory(poCode)
        .then(function (response) {
            RenderBudgetHistoryRows(NormalizeBudgetHistoryList(response));
        })
        .catch(function () {
            $('#budgetHistoryBody').html(
                '<tr><td colspan="7" class="text-center py-3" style="color:#ef4444;font-size:0.82rem;">' +
                'Failed to load budget history.</td></tr>'
            );
        });
}

// ─── DISPLAY HELPERS ──────────────────────────────────────────────────────────
function ShowLoading(show) {
    document.getElementById('poPendingLoading').style.display = show ? '' : 'none';
    document.getElementById('poPendingList').style.display    = show ? 'none' : '';
}

function ShowEmpty(show) {
    document.getElementById('poPendingEmpty').style.display = show ? '' : 'none';
}

/** Same attachment host + API as PO Store grid (`PurchaseOrderStore.js`). */
function OpenPOApprovalAttachment(code, poNo, poDate) {
    if (typeof window.openPOListAttachmentControl !== 'function') {
        toastr.error('Attachments are not available. Please refresh the page.');
        return;
    }
    window.openPOListAttachmentControl(code, poNo, poDate, 'view');
}

function OpenPOApprovalAttachmentFromModal() {
    const code = parseInt($('#hfPOCode').val() || '0', 10);
    const poNo = $('#hfAttachPONo').val() || '';
    const poDate = $('#hfAttachPODate').val() || '';
    OpenPOApprovalAttachment(code, poNo, poDate);
}

function NavigateToPOStore() {
    const appBase = (sessionStorage.getItem('AppBaseURL') || (window.location.origin + '/'))
        .replace(/\/?$/, '/');
    window.location.href = appBase + 'PurchaseTransactions/PurchaseOrder/PurchaseOrderStore?ModuleDesp=Purchase%20Order%20(Store)';
}

/** Print / preview from detail modal — uses same flow as Purchase Order Store (PrintPO + modalPrintOptions). */
function PrintPOFromDetail(mode) {
    const c = parseInt($('#hfPOCode').val() || '0', 10);
    if (!c) {
        toastr.warning('No PO selected.');
        return;
    }
    if (typeof window.PrintPO !== 'function') {
        toastr.error('Print is not available. Please refresh the page.');
        return;
    }
    window.PrintPO(c, mode === 'print' ? 'print' : 'preview');
}

// ─── EXPOSE GLOBALS (onclick handlers in HTML) ────────────────────────────────
window.LoadPOList        = LoadPOList;
window.OpenDetailModal   = OpenDetailModal;
window.SubmitApproval    = SubmitApproval;
window.CloseDetailModal  = CloseDetailModal;
window.CloseConfirmModal = CloseConfirmModal;
window.OpenBudgetHistoryModal = OpenBudgetHistoryModal;
window.CloseBudgetHistoryModal = CloseBudgetHistoryModal;
window.NavigateToPOStore = NavigateToPOStore;
window.PrintPOFromDetail = PrintPOFromDetail;
window.OpenPOApprovalAttachment = OpenPOApprovalAttachment;
window.OpenPOApprovalAttachmentFromModal = OpenPOApprovalAttachmentFromModal;
