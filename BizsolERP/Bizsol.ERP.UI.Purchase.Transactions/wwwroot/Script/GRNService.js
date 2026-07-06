import { GRNService }          from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_GRNService.js';
import { MRNMasterApprovalService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MRNMasterApprovalService.js';
import { AttachmentControlService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_AttachmentControlService.js';
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
let rowIndex          = 0;
let poList            = [];
/** Cached from GetVendor — party / account lookup for GetPOList. */
let grnVendorListCache = [];

let projectItemsCache = [];
let editMode          = false;
let editCode          = 0;

let grnVerifyPendingCode = 0;
let grnHasVerifyRight = false;
let grnHasEditAfterVerificationRight = false;
let grnMasterSourceRows = [];
/** Edit/New form: master already has attachment(s) — footer Attachment button green with list/API */
let grnFormHasAttachmentYes = false;
/** List grid: verified via GetAllDocumentAttachment (same source as Attachment control modal). */
let grnListAttachmentYesMap = {};
/** Codes (integer) of GRN records that MRN approval API reports as fully approved. */
let grnMrnApprovedCodeSet = new Set();

/** Codes of GRNs that are rejected in the MRN approval workflow — keyed by integer Code */
var grnRejectedCodesSet = {};
/** GRN list rows keyed by Code so View can reuse LevelDetails / CurrentLevelDesc labels. */
let grnApprovalSourceRowByCode = {};

/** Monotonic token — stale loadGRNList responses must not overwrite newer badge counts. */
let grnListLoadSeq = 0;
/** Pending-on-me count from MRN approval view; this is the source for the GRN list badge when available. */
let grnApprovalPendingOnMeCount = null;
var GRN_APPROVAL_PENDING_ON_ME_SESSION_KEY = "bizsol_grnApprovalPendingOnMeCount";

/**
 * Single writer for GRN list header “Pending on me” stat chip (grnStatPendingOnMe).
 * @param {number|string} count
 */
function setGrnListPendingOnMeBadge(count) {
    var n = parseInt(count, 10);
    if (!Number.isFinite(n) || n < 0) n = 0;
    var elOM = document.getElementById("grnStatPendingOnMe");
    if (elOM) elOM.textContent = String(n);
    return n;
}

/** Prefer approval-chip count when loaded; avoids race with parallel loadGRNList / LoadPaymentList. */
function readApprovalChipCount(chipId) {
    var el = document.getElementById(chipId);
    if (!el) return null;
    var t = String(el.textContent || "").trim();
    if (t === "" || t === "—") return null;
    var n = parseInt(t, 10);
    return Number.isFinite(n) ? Math.max(0, n) : null;
}

/** Sync GRN list status metadata from embedded approval view; list tab counts stay based on list rows. */
function syncGrnListHeaderTabsFromApprovalChips(stats) {
    if (!stats || typeof stats !== "object") return;
    var statusCodesChanged = false;
    if (stats.pendingOnMe !== undefined && stats.pendingOnMe !== null) {
        var pendingOnMeCount = parseInt(stats.pendingOnMe, 10);
        grnApprovalPendingOnMeCount = Number.isFinite(pendingOnMeCount) ? Math.max(0, pendingOnMeCount) : null;
    }
    if (Array.isArray(stats.approvedCodes)) {
        grnMrnApprovedCodeSet = new Set(
            stats.approvedCodes
                .map(function (c) { return parseInt(c, 10); })
                .filter(function (n) { return n > 0; })
        );
        statusCodesChanged = true;
    }
    if (Array.isArray(stats.rejectedCodes)) {
        grnRejectedCodesSet = {};
        stats.rejectedCodes
            .map(function (c) { return parseInt(c, 10); })
            .filter(function (n) { return n > 0; })
            .forEach(function (n) { grnRejectedCodesSet[n] = true; });
        statusCodesChanged = true;
    }
    if ((grnMasterSourceRows || []).length > 0) {
        updateGrnListStatChips();
        if (statusCodesChanged) refreshGRNListGrid();
    } else if (grnApprovalPendingOnMeCount !== null) {
        setGrnListPendingOnMeBadge(grnApprovalPendingOnMeCount);
    }
}

function readStoredApprovalPendingOnMeCount() {
    try {
        var raw = sessionStorage.getItem(GRN_APPROVAL_PENDING_ON_ME_SESSION_KEY);
        if (raw === null || raw === undefined || String(raw).trim() === "") return null;
        var n = parseInt(raw, 10);
        return Number.isFinite(n) ? Math.max(0, n) : null;
    } catch (e) {
        return null;
    }
}

function refreshGrnPendingOnMeBadgeFromApprovalApi(fromDate, toDate) {
    var filters = getGrnListFilterValues();
    var fd = fromDate || filters.FromDate || document.getElementById("lstTxtFromDate")?.value || "";
    var td = toDate || filters.ToDate || document.getElementById("lstTxtToDate")?.value || "";
    return MRNMasterApprovalService.GetPendingMRNMasterList("A", fd, td)
        .then(function (res) {
            var rows = normalizeApiRows(res);
            var count = 0;
            if (typeof window.countMrnPendingOnMeFromList === "function") {
                count = window.countMrnPendingOnMeFromList(rows);
            } else {
                count = rows.length;
            }
            grnApprovalPendingOnMeCount = count;
            setGrnListPendingOnMeBadge(count);
            try {
                sessionStorage.setItem(GRN_APPROVAL_PENDING_ON_ME_SESSION_KEY, String(count));
            } catch (e) {
                /* ignore */
            }
            return count;
        })
        .catch(function () {
            return null;
        });
}

/**
 * Grid Verify button: **Y** = show Verify when user has right; **N** = hide Verify button (verified badge unchanged).
 * Optional: sessionStorage `bizsol_grn_multilevel_verification`, or API wrapper fields MultiLevelVerification / multiLevelVerification.
 */
var GRN_MULTILEVEL_VERIFICATION_SESSION_KEY = "bizsol_grn_multilevel_verification";

window.multilevelverification = "Y";

function normalizeGrnMultilevelYn(v) {
    var s = (v == null ? "" : String(v)).trim().toUpperCase();
    return s === "Y" || s === "YES" || s === "1" || s === "TRUE" ? "Y" : "N";
}

function resolveGrnMultilevelVerificationFromStorage() {
    try {
        var raw = sessionStorage.getItem(GRN_MULTILEVEL_VERIFICATION_SESSION_KEY);
        if (raw != null && String(raw).trim() !== "") {
            window.multilevelverification = normalizeGrnMultilevelYn(raw);
            return;
        }
    } catch (e) {
        /* ignore */
    }
    window.multilevelverification = normalizeGrnMultilevelYn(window.multilevelverification);
}

/** When false, grid omits the row Verify button (multilevelverification === 'N'). */
function grnGridVerifyButtonAllowedByMultilevel() {
    return normalizeGrnMultilevelYn(window.multilevelverification) === "Y";
}

/** @param {boolean} [persistSession] persist for next visits */
function setGrnMultilevelVerification(value, persistSession) {
    window.multilevelverification = normalizeGrnMultilevelYn(value);
    if (persistSession) {
        try {
            sessionStorage.setItem(GRN_MULTILEVEL_VERIFICATION_SESSION_KEY, window.multilevelverification);
        } catch (e) {
            /* ignore */
        }
    }
    if ((grnMasterSourceRows || []).length > 0) {
        refreshGRNListGrid();
    }
}

function applyGrnMultilevelVerificationFromApiPayload(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
    var v =
        payload.MultiLevelVerification !== undefined && payload.MultiLevelVerification !== null
            ? payload.MultiLevelVerification
            : payload.multiLevelVerification !== undefined && payload.multiLevelVerification !== null
              ? payload.multiLevelVerification
              : payload.MultilevelVerification;
    if (v === undefined || v === null) return false;
    window.multilevelverification = normalizeGrnMultilevelYn(v);
    return true;
}

/** Persist verified row codes (list API often omits Verified) — badge stays after refresh. */
var GRN_VERIFIED_CODES_STORAGE_KEY = "bizsol_grnService_verified_codes";

function getRememberedGrnVerifiedCodeSet() {
    try {
        var raw = sessionStorage.getItem(GRN_VERIFIED_CODES_STORAGE_KEY);
        if (!raw) return {};
        var arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return {};
        var o = {};
        for (var i = 0; i < arr.length; i++) {
            var n = parseInt(arr[i], 10);
            if (!isNaN(n)) o[n] = true;
        }
        return o;
    } catch (e) {
        return {};
    }
}

function rememberGrnVerifiedCode(code) {
    var n = parseInt(code, 10);
    if (isNaN(n)) return;
    var set = getRememberedGrnVerifiedCodeSet();
    set[n] = true;
    var arr = Object.keys(set).map(function (k) {
        return parseInt(k, 10);
    });
    try {
        sessionStorage.setItem(GRN_VERIFIED_CODES_STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {}
}

function applyRememberedVerifiedToRows(rows) {
    var set = getRememberedGrnVerifiedCodeSet();
    var has = Object.keys(set).length > 0;
    if (!has) return rows.slice();
    return rows.map(function (row) {
        var rc = parseInt(row.Code ?? row.code ?? 0, 10);
        // Don't overwrite rows that already have a definitive status from the API (P=Approved, R=Rejected)
        var existing = String(row.Verified ?? row.verified ?? "").trim().toUpperCase();
        if (!isNaN(rc) && set[rc] && existing !== "P" && existing !== "REJECTED" && existing !== "R") {
            return Object.assign({}, row, { Verified: "Y" });
        }
        return row;
    });
}

function resolveGRNVerifyRight() {
    var FinYear = getFinancialYear();
    return MenuService.CheckModuleOptionRight("GRN Services", "Verify", "N", FinYear)
        .then(function (response) {
            grnHasVerifyRight = response && response.CheckModuleOptionRight === "Y";
        })
        .catch(function () {
            grnHasVerifyRight = false;
        });
}

function resolveGrnEditAfterVerificationRight() {
    var FinYear = getFinancialYear();
    return MenuService.CheckModuleOptionRight("GRN Services", "Edit After Verification", "N", FinYear)
        .then(function (response) {
            grnHasEditAfterVerificationRight = response && response.CheckModuleOptionRight === "Y";
        })
        .catch(function () {
            grnHasEditAfterVerificationRight = false;
        });
}

/** Verified (Y) or fully approved — edit blocked unless user has Edit After Verification right. */
function grnIsVerifiedOrApprovedForEditBlock(item) {
    if (!item || typeof item !== "object") return false;
    if (rowIsVerifiedGrn(item)) return true;
    return computeGrnListStatusCode(item) === "P";
}

function grnIsVerifiedOrApprovedForEditBlockByCode(codeNum) {
    const n = parseInt(codeNum, 10);
    if (!Number.isFinite(n) || n <= 0) return false;
    const raw = grnGetListRowRawByCode(n);
    if (raw) return grnIsVerifiedOrApprovedForEditBlock(raw);
    return n > 0 && grnMrnApprovedCodeSet.has(n);
}

function checkGrnEditAfterVerificationRight(showMsg) {
    var FinYear = getFinancialYear();
    return MenuService.CheckModuleOptionRight("GRN Services", "Edit After Verification", showMsg || "N", FinYear)
        .then(function (response) {
            return !!(response && response.CheckModuleOptionRight === "Y");
        })
        .catch(function () {
            return false;
        });
}

function rowIsVerifiedGrn(item) {
    if (!item || typeof item !== "object") return false;
    var v =
        item.Verified !== undefined && item.Verified !== null
            ? item.Verified
            : item.verified !== undefined && item.verified !== null
              ? item.verified
              : item.IsVerified !== undefined && item.IsVerified !== null
                ? item.IsVerified
                : item.isVerified !== undefined && item.isVerified !== null
                  ? item.isVerified
                  : item.Verify !== undefined && item.Verify !== null
                    ? item.Verify
                    : item.verify;
    if (v === undefined || v === null) return false;
    if (typeof v === "string") {
        var u = v.trim().toUpperCase();
        return u === "Y" || u === "YES" || v === "1" || u === "TRUE" || u === "V" || u === "APPROVED";
    }
    return v === true || v === 1;
}

/** MRN multi-level approval complete — hide inline Verify; show approved badge instead. */
function rowIsMrnApprovedGrn(item) {
    if (!item || typeof item !== "object") return false;
    var raw = String(item.ApprovalStatus ?? item.Status ?? item.Approval_Status ?? "").trim();
    if (!raw) return false;
    var upper = raw.toUpperCase();
    var lower = raw.toLowerCase();
    if (upper === "P" || upper === "Y" || lower === "approved") return true;
    if (lower === "complete" || lower === "completed") return true;
    var cur = parseInt(item.CurrentLevelNo ?? item.CurrentLevel ?? 0, 10) || 0;
    var tot = parseInt(item.TotalLevels ?? item.MaxLevel ?? 0, 10) || 0;
    return tot > 0 && cur > tot;
}

function rowIsRejectedGrn(item) {
    if (!item || typeof item !== "object") return false;
    var rejectFlag = item.IsRejected ?? item.isRejected ?? item.Rejected ?? item.rejected
        ?? item.Reject_IND ?? item.RejectInd ?? item.RejectedYN;
    if (rejectFlag === true || rejectFlag === 1 || rejectFlag === "Y" || rejectFlag === "y" || String(rejectFlag).toLowerCase() === "true") {
        return true;
    }
    // Primary: same Verified field — API returns "Rejected" as the value
    var v =
        item.Verified !== undefined && item.Verified !== null
            ? item.Verified
            : item.verified !== undefined && item.verified !== null
              ? item.verified
              : item.ApprovalStatus !== undefined && item.ApprovalStatus !== null
                ? item.ApprovalStatus
                : item.approvalStatus !== undefined && item.approvalStatus !== null
                  ? item.approvalStatus
                  : item.IsRejected !== undefined && item.IsRejected !== null
                    ? item.IsRejected
                    : item.Status !== undefined && item.Status !== null
                      ? item.Status
                      : item.status;
    if (v !== undefined && v !== null && typeof v === "string") {
        var u = v.trim().toUpperCase();
        var low = v.trim().toLowerCase();
        if (u === "REJECTED" || u === "REJECT" || u === "R" || u === "RECT" || u.indexOf("RECTIF") === 0 || low === "rejected" || low === "reject") return true;
    }
    // Secondary: check against codes fetched from MRN approval API
    var c = parseInt(item.Code ?? item.code ?? 0, 10);
    return !!(c && grnRejectedCodesSet[c]);
}

function normalizeGrnListStatusValue(value, yMeansApproved) {
    if (value === undefined || value === null) return "";
    var rawStr = String(value).trim();
    var s = rawStr.toUpperCase();
    var slow = rawStr.toLowerCase();

    if (s === "R" || s === "REJECTED" || s === "REJECT" || s === "RECT" || s.indexOf("RECTIF") === 0 || slow === "rejected" || slow === "reject") {
        return "R";
    }
    if (s === "P" || s === "APPROVED" || s === "APPROVE" || slow === "approved" || slow === "complete" || slow === "completed") {
        return "P";
    }
    if (yMeansApproved && (s === "Y" || s === "YES" || s === "TRUE" || s === "1")) {
        return "P";
    }
    if (
        slow.indexOf("fully approved") >= 0 ||
        slow.indexOf("final approved") >= 0 ||
        slow.indexOf("all approved") >= 0 ||
        (slow.indexOf("all levels") >= 0 && slow.indexOf("approved") >= 0)
    ) {
        return "P";
    }
    return "";
}

/**
 * Returns 'P' (Approved/Posted), 'R' (Rejected), or 'N' (Pending).
 * API Verified field mapping: 'P' = Approved, 'R' = Rejected, 'Y' = Pending (entry saved, not yet approved).
 * Mirrors normalizeGpaListStatusCode in GRNPaymentEntry.js.
 */
function computeGrnListStatusCode(row) {
    if (!row || typeof row !== "object") return "N";

    // Primary: check Verified field with correct DB mapping
    var verifiedRaw = row.Verified ?? row.verified ?? row.IsVerified ?? row.isVerified ?? row.Verify ?? row.verify;
    if (verifiedRaw !== undefined && verifiedRaw !== null) {
        var verifiedStatus = normalizeGrnListStatusValue(verifiedRaw, false);
        if (verifiedStatus === "P" || verifiedStatus === "R") return verifiedStatus;
        // 'Y' = entry saved but not yet approved → falls through to Pending
    }

    if (rowIsRejectedGrn(row)) return "R";

    var statusRaw =
        row.Status ?? row.status ?? row.ApprovalStatus ?? row.approvalStatus ?? row.Approval_Status
        ?? row.EntryStatus ?? row.entryStatus ?? row.RecordStatus ?? row.recordStatus
        ?? row.Flag ?? row.flag ?? row.CodeStatus ?? row.codeStatus ?? row.MasterStatus ?? row.masterStatus;
    var statusCode = normalizeGrnListStatusValue(statusRaw, true);
    if (statusCode === "P" || statusCode === "R") return statusCode;

    // Fallback: MRN multi-level approval data (rejection or approval via approval API)
    var code = parseInt(row.Code ?? row.code ?? 0, 10);
    if (rowIsMrnApprovedGrn(row) || (code > 0 && grnMrnApprovedCodeSet.has(code))) return "P";
    var boolOk = row.IsApproved ?? row.isApproved ?? row.Approved ?? row.approved;
    if (boolOk === true || boolOk === 1 || boolOk === "Y" || boolOk === "y") return "P";
    return "N";
}

function escapeGrnAttr(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function getGrnVerifiedByDisplay(item) {
    if (!item) return "";
    var v =
        item.VerifiedByName ||
        item.VerifiedByDesp ||
        item.VerifiedBy ||
        item["Verify By"] ||
        item["Verified By"] ||
        item.UserVerifiedBy;
    if (v === undefined || v === null || v === "") return "";
    if (typeof v === "number" && v === 0) return "";
    return String(v).trim();
}

function getGrnVerifiedOnRaw(item) {
    if (!item) return null;
    var d =
        item.VerifiedON !== undefined && item.VerifiedON !== null
            ? item.VerifiedON
            : item.VerifiedOn !== undefined && item.VerifiedOn !== null
              ? item.VerifiedOn
              : item["Verified ON"] !== undefined && item["Verified ON"] !== null
                ? item["Verified ON"]
                : item["Verified On"];
    return d === undefined ? null : d;
}

function pad2GrnDate(n) {
    return n < 10 ? "0" + n : String(n);
}

function formatDateDdMmYyyyGrn(d) {
    if (!(d instanceof Date) || isNaN(d.getTime())) return "";
    return pad2GrnDate(d.getDate()) + "/" + pad2GrnDate(d.getMonth() + 1) + "/" + d.getFullYear();
}

function formatGrnVerifiedOnDisplay(val) {
    if (val === null || val === undefined || val === "") return "";
    if (typeof val === "number" && isFinite(val)) {
        return formatDateDdMmYyyyGrn(new Date(val));
    }
    if (typeof val === "string") {
        var t = val.trim();
        if (!t) return "";
        var parsed = Date.parse(t);
        if (!isNaN(parsed)) return formatDateDdMmYyyyGrn(new Date(parsed));
        return t;
    }
    if (val instanceof Date) return formatDateDdMmYyyyGrn(val);
    return String(val);
}

var grnVerifyPopoverOpenAnchor = null;
var grnVerifyPopoverOutsideHandler = null;

function closeGrnVerifyDetailPopover() {
    var pop = document.getElementById("grnVerifyDetailPopover");
    if (pop) pop.style.display = "none";
    grnVerifyPopoverOpenAnchor = null;
    if (grnVerifyPopoverOutsideHandler) {
        document.removeEventListener("mousedown", grnVerifyPopoverOutsideHandler, true);
        grnVerifyPopoverOutsideHandler = null;
    }
}

function positionGrnVerifyPopoverNear(anchorEl) {
    var pop = document.getElementById("grnVerifyDetailPopover");
    var inner = pop && pop.querySelector(".grn-verify-popover-inner");
    if (!pop || !inner || !anchorEl) return;
    var rect = anchorEl.getBoundingClientRect();
    var w = inner.offsetWidth || 260;
    var h = inner.offsetHeight || 80;
    var left = rect.left + rect.width / 2 - w / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    var top = rect.bottom + 10;
    if (top + h > window.innerHeight - 12) {
        top = rect.top - h - 10;
    }
    if (top < 8) top = 8;
    pop.style.left = left + "px";
    pop.style.top = top + "px";
}

function showGrnVerifyDetailFromBadge(el) {
    var enc = el.getAttribute("data-grn-verify-info");
    var bodyEl = document.getElementById("grnVerifyDetailPopoverBody");
    var pop = document.getElementById("grnVerifyDetailPopover");
    if (grnVerifyPopoverOpenAnchor === el && pop && pop.style.display === "block") {
        closeGrnVerifyDetailPopover();
        return;
    }
    if (!bodyEl || !pop) {
        if (!enc) return;
        var txt0 = decodeURIComponent(enc);
        var oneLine0 = txt0.replace(/\s*\n+\s*/g, " · ");
        if (typeof toastr !== "undefined") {
            toastr.info(oneLine0, "Verify", { timeOut: 5500 });
        } else {
            window.alert(txt0);
        }
        return;
    }
    closeGrnVerifyDetailPopover();
    var txt = enc ? decodeURIComponent(enc) : "This GRN has been verified.";
    var oneLine = txt.replace(/\s*\n+\s*/g, " · ");
    bodyEl.textContent = oneLine;
    grnVerifyPopoverOpenAnchor = el;
    pop.style.display = "block";
    requestAnimationFrame(function () {
        positionGrnVerifyPopoverNear(el);
        requestAnimationFrame(function () {
            positionGrnVerifyPopoverNear(el);
        });
    });
    setTimeout(function () {
        grnVerifyPopoverOutsideHandler = function (e) {
            if (el.contains(e.target)) return;
            if (pop.contains(e.target)) return;
            closeGrnVerifyDetailPopover();
        };
        document.addEventListener("mousedown", grnVerifyPopoverOutsideHandler, true);
    }, 0);
}

function buildGrnVerifiedBadgeHtml(item) {
    var by = getGrnVerifiedByDisplay(item);
    var on = formatGrnVerifiedOnDisplay(getGrnVerifiedOnRaw(item));
    var parts = [];
    if (by) parts.push("Verify By: " + by);
    if (on) parts.push("Verified ON: " + on);
    var payload = parts.length ? parts.join("\n") : "This GRN has been verified.";
    var titleAttr = ' title="' + escapeGrnAttr(parts.length ? parts.join(" · ") : "Verified — click for details") + '"';
    var dataAttr = ' data-grn-verify-info="' + encodeURIComponent(payload) + '"';
    var a11y =
        ' role="button" tabindex="0" aria-label="' +
        escapeGrnAttr(parts.length ? parts.join(". ") : "Verified. Click for details.") +
        '"';
    return (
        '<span class="grn-verify-status grn-verify-status--done grn-verify-status--with-detail"' +
        titleAttr +
        dataAttr +
        a11y +
        ">Verify</span>"
    );
}

function grnBizsolMetaKey(k) {
    return typeof k === "string" && k.indexOf("__bizsol") === 0;
}

function grnAttachmentYesFromRaw(raw) {
    if (raw === undefined || raw === null) return false;
    var s = String(raw).trim().toLowerCase();
    return s === "yes" || s === "y" || s === "true" || s === "1";
}

function grnFindHasAttachmentColumnKey(item) {
    if (!item || typeof item !== "object") return null;
    var direct = [
        "HASATTACHMENT",
        "HasAttachment",
        "hasAttachment",
        "HAS_ATTACH",
        "Has_Attachment",
        "Has Attachment",
    ];
    var i;
    for (i = 0; i < direct.length; i++) {
        if (Object.prototype.hasOwnProperty.call(item, direct[i])) return direct[i];
    }
    for (var k in item) {
        if (!Object.prototype.hasOwnProperty.call(item, k) || grnBizsolMetaKey(k)) continue;
        var kn = String(k).replace(/\s+/g, "");
        if (/hasattachment/i.test(kn)) return k;
    }
    return null;
}

function grnItemHasAttachmentYes(item) {
    if (!item || typeof item !== "object") return false;
    var k = grnFindHasAttachmentColumnKey(item);
    return k ? grnAttachmentYesFromRaw(item[k]) : false;
}

/** List row paperclip: prefer attachment-control API over list HasAttachment flag. */
function grnListRowHasAttachmentYes(item) {
    if (!item || typeof item !== "object") return false;
    var code = parseInt(String(item.Code != null ? item.Code : item.code != null ? item.code : 0), 10) || 0;
    if (code > 0 && Object.prototype.hasOwnProperty.call(grnListAttachmentYesMap, code)) {
        return !!grnListAttachmentYesMap[code];
    }
    return grnItemHasAttachmentYes(item);
}

/** Reconcile list HasAttachment with GetAllDocumentAttachment (modal uses the same API). */
async function grnSyncListAttachmentStates(rows) {
    grnListAttachmentYesMap = {};
    if (!Array.isArray(rows) || rows.length === 0) return;
    var tasks = rows.map(function (item) {
        if (!item || typeof item !== "object") return Promise.resolve();
        var rowCode = parseInt(String(item.Code != null ? item.Code : item.code != null ? item.code : 0), 10) || 0;
        if (!rowCode) return Promise.resolve();
        return AttachmentControlService.GetAttachmentUploadFiles("MRNMaster", rowCode, "", 0)
            .then(function (resp) {
                var apiRows = grnNormalizeAttachmentApiRows(resp);
                grnListAttachmentYesMap[rowCode] = apiRows.length > 0;
            })
            .catch(function () {
                grnListAttachmentYesMap[rowCode] = grnItemHasAttachmentYes(item);
            });
    });
    await Promise.all(tasks);
}

/** SHOWDATA sometimes omits HasAttachment; list row still has it */
function grnResolveHasAttachmentYesFromList(masterCode) {
    var c = parseInt(String(masterCode != null ? masterCode : 0), 10) || 0;
    if (!c) return false;
    var rows = grnMasterSourceRows;
    if (!Array.isArray(rows)) return false;
    var i;
    for (i = 0; i < rows.length; i++) {
        var r = rows[i];
        if (!r || typeof r !== "object") continue;
        var rc = parseInt(String(r.Code != null ? r.Code : r.code != null ? r.code : 0), 10) || 0;
        if (rc !== c) continue;
        return grnItemHasAttachmentYes(r);
    }
    return false;
}

function syncGrnFooterAttachmentButtonState(pendingQueueCount) {
    var btn = document.getElementById("btnGrnFooterAttach");
    if (!btn) return;
    var pending = pendingQueueCount;
    if (pending === undefined || pending === null) {
        var badge = document.getElementById("grnTempAttachBadge");
        pending = badge ? parseInt(String(badge.textContent || "0").trim(), 10) || 0 : 0;
    } else {
        pending = parseInt(String(pendingQueueCount), 10) || 0;
    }
    var yes = !!grnFormHasAttachmentYes || pending > 0;
    btn.classList.toggle("btn-grn-footer-attach--yes", yes);
}

function grnNormalizeAttachmentApiRows(resp) {
    if (Array.isArray(resp)) return resp;
    if (!resp || typeof resp !== "object") return [];
    if (Array.isArray(resp.Data)) return resp.Data;
    if (Array.isArray(resp.data)) return resp.data;
    if (Array.isArray(resp.Table)) return resp.Table;
    return [];
}

/** Edit form: HasAttachment from master/list + same GetAllDocumentAttachment source as Attachment control */
async function grnSyncFooterAttachmentFromApis(master, masterCode) {
    var c = parseInt(String(masterCode != null ? masterCode : 0), 10) || 0;
    grnFormHasAttachmentYes =
        grnItemHasAttachmentYes(master || {}) || grnResolveHasAttachmentYesFromList(c);
    if (c > 0) {
        try {
            var resp = await AttachmentControlService.GetAttachmentUploadFiles("MRNMaster", c, "", 0);
            var rows = grnNormalizeAttachmentApiRows(resp);
            grnFormHasAttachmentYes = rows.length > 0;
            grnListAttachmentYesMap[c] = grnFormHasAttachmentYes;
        } catch (err) {
            console.warn("grnSyncFooterAttachmentFromApis:", err);
        }
    }
    syncGrnFooterAttachmentButtonState();
}

function mapGRNRowsToGrid(rows) {
    return rows.map(function (item) {
        const code = item.Code ?? item.code ?? 0;
        grnRememberApprovalSourceRow(item);
        const mrnRaw = item.MRNNo ?? item.mRNNo ?? item.GRNo ?? item.grnNo ?? 0;
        const enNum = parseInt(mrnRaw, 10) || 0;
        const attachBillDate = grnResolveAttachmentEntryDate(item, '');
        const hasAttachmentYes = grnListRowHasAttachmentYes(item);
        const attachBtnClass = hasAttachmentYes ? "im-btn-attach im-btn-attach--has-attachment" : "im-btn-attach";
        const editBtn =
            '<button class="im-btn-edit" title="Edit" onclick="editGRN(' + code + ')">' +
            '<i class="fas fa-pen"></i></button>';
        var btns =
            '<button type="button" class="im-btn-view" title="View" onclick="viewGRNFromList(' + code + ')">' +
            '<i class="fa fa-eye"></i></button>' +
            '<button type="button" class="im-btn-print-preview" title="Print Preview" onclick="PrintGRNServiceFromList(' + code + ',\'preview\')">' +
            '<i class="fa fa-search-plus"></i></button>' +
            '<button type="button" class="im-btn-print" title="Print" onclick="PrintGRNServiceFromList(' + code + ',\'print\')">' +
            '<i class="fa fa-print"></i></button>' +
            editBtn +
            '<button type="button" class="' + attachBtnClass + '" title="Attachment" onclick="openGrnServiceListAttachmentControl(' + code + ',' + enNum + ',\'' + attachBillDate + '\')">' +
            '<i class="fas fa-paperclip"></i></button>' +
            '<button class="im-btn-delete" title="Delete" onclick="confirmDeleteGRN(' + code + ', \'' + (item.GRNo ?? item.MRNNo ?? '') + '\')">' +
            '<i class="fas fa-trash-can"></i></button>';
        var patch = { Action: btns };
        return Object.assign({}, item, patch);
    });
}

function getGRNListHiddenColumns() {
    var cols = [
        "PartyMaster_Code",
        "Code",
        "Verified",
        "VerifiedBy",
        "VerifiedByName",
        "VerifiedByDesp",
        "VerifiedON",
        "VerifiedOn",
        "Verify By",
        "Verified By",
        "Verified ON",
        "Verified On",
        "HasAttachment",
    ];
    cols.push("Verify");
    cols.push("__bizsolRowClass");
    return cols;
}

function getGRNListColumnAlignment() {
    return {
        Action: "center;min-width:360px;white-space:nowrap;",
    };
}

function updateGrnListStatChips() {
    var rows = grnMasterSourceRows || [];
    var total = rows.length;
    var pending = 0;
    var approved = 0;
    var rejected = 0;
    for (var i = 0; i < rows.length; i++) {
        var st = computeGrnListStatusCode(rows[i]);
        if (st === "P") approved++;
        else if (st === "R") rejected++;
        else pending++;
    }
    var fmt = function (n) { return n > 0 ? String(n) : "—"; };
    var elTotal = document.getElementById("grnStatTotal");
    var elP = document.getElementById("grnStatPending");
    var elV = document.getElementById("grnStatApproved");
    var elR = document.getElementById("grnStatRejected");
    if (elTotal) elTotal.textContent = total > 0 ? String(total) : "—";
    if (elP) elP.textContent = fmt(pending);
    if (elV) elV.textContent = fmt(approved);
    if (elR) elR.textContent = fmt(rejected);

    var storedCount = readStoredApprovalPendingOnMeCount();
    if (grnApprovalPendingOnMeCount === null && storedCount !== null) {
        grnApprovalPendingOnMeCount = storedCount;
    }
    if (grnApprovalPendingOnMeCount !== null) {
        setGrnListPendingOnMeBadge(grnApprovalPendingOnMeCount);
    } else {
        setGrnListPendingOnMeBadge(0);
    }
}

function grnGetSessionUserCode() {
    try { var a = JSON.parse(sessionStorage.getItem("authKey")); return parseInt(a && a.UserMaster_Code, 10) || 0; } catch (e) { return 0; }
}
function grnGetSessionGroupCode() {
    try {
        var d = JSON.parse(sessionStorage.getItem("UserDetails"));
        if (Array.isArray(d) && d[0] != null) return parseInt(d[0].GroupMaster_Code, 10) || 0;
    } catch (e) { /* ignore */ }
    return 0;
}
function grnTruthyFlag(v) {
    if (v === true || v === 1) return true;
    var s = (v != null ? String(v) : "").trim().toLowerCase();
    return s === "y" || s === "1" || s === "true";
}
function grnPickFirstPositiveInt(obj, keys) {
    if (!obj || typeof obj !== "object") return 0;
    for (var i = 0; i < keys.length; i++) {
        var v = obj[keys[i]];
        if (v == null || v === "") continue;
        var n = parseInt(v, 10);
        if (isFinite(n) && n > 0) return n;
    }
    return 0;
}
function rowIsPendingOnMeGrn(item) {
    if (!item || typeof item !== "object") return false;
    // If backend explicitly flags the row
    if (grnTruthyFlag(item.IsPendingForMe) || grnTruthyFlag(item.PendingForMe) ||
        grnTruthyFlag(item.CanApproveNow) || grnTruthyFlag(item.IsMyApproval) ||
        grnTruthyFlag(item.PendingOnMe)) {
        return true;
    }
    var me = grnGetSessionUserCode();
    var myG = grnGetSessionGroupCode();
    var approverU = grnPickFirstPositiveInt(item, [
        "CurrentApproverUserMaster_Code", "ApproverUserMaster_Code",
        "NextApproverUserMaster_Code", "PendingApproverUserMaster_Code"
    ]);
    var approverG = grnPickFirstPositiveInt(item, [
        "CurrentApproverGroupMaster_Code", "ApproverGroupMaster_Code",
        "NextApproverGroupMaster_Code", "PendingApproverGroupMaster_Code"
    ]);
    if (me > 0 && approverU > 0 && approverU === me) return true;
    if (myG > 0 && approverG > 0 && approverG === myG) return true;
    // No assignee info in list data — count as pending on me
    if ((approverU + approverG) === 0) return true;
    return false;
}

/** Opens GRN Service / MRN multi-level approval (same pattern as MRNMasterApproval.js back-link). */
function navigateToMRNMasterApproval() {
    var base = sessionStorage.getItem("AppBaseURL") || (window.location.origin + "/");
    base = base.replace(/\/?$/, "/");
    window.location.href =
        base + "PurchaseTransactions/GRNService/MRNMasterApproval?ModuleDesp=GRN%20Services";
}

/** Same session key as MRNMasterApproval.js — after redirect, approval list applies pending approval filter */
var GRN_MRN_APPROVAL_LANDING_PENDING_ON_ME_KEY = "bizsol_mrnLandingPendingOnMe";
/** Same session key as MRNMasterApproval.js — reload approval cards after GRN save/update */
var GRN_MRN_APPROVAL_REFRESH_KEY = "bizsol_mrnApprovalRefresh";

function signalMrnApprovalListRefresh() {
    try {
        sessionStorage.setItem(GRN_MRN_APPROVAL_REFRESH_KEY, String(Date.now()));
    } catch (e) {
        /* ignore */
    }
    var approvalEl = document.getElementById("divGRNApprovalView");
    if (approvalEl && approvalEl.style.display !== "none" && typeof window.reloadMrnApprovalView === "function") {
        window.reloadMrnApprovalView({});
    }
}

function showApprovalViewOnly() {
    document.getElementById('divGRNList').style.display = 'none';
    document.getElementById('divGRNForm').style.display = 'none';
    document.getElementById('floatBar').style.display   = 'none';
    const approvalEl = document.getElementById('divGRNApprovalView');
    if (approvalEl) approvalEl.style.display = 'block';
}

function navigateToMRNMasterApprovalPendingOnMe() {
    try {
        sessionStorage.setItem(GRN_MRN_APPROVAL_LANDING_PENDING_ON_ME_KEY, "Y");
        var fromEl = document.getElementById("lstTxtFromDate");
        var toEl = document.getElementById("lstTxtToDate");
        if (fromEl && fromEl.value) {
            sessionStorage.setItem("bizsol_mrnLandingFromDate", fromEl.value);
        }
        if (toEl && toEl.value) {
            sessionStorage.setItem("bizsol_mrnLandingToDate", toEl.value);
        }
    } catch (e) {
        /* ignore */
    }
    var base = sessionStorage.getItem("AppBaseURL") || (window.location.origin + "/");
    base = base.replace(/\/?$/, "/");
    window.location.href =
        base + "PurchaseTransactions/GRNService/MRNMasterApproval?ModuleDesp=GRN%20Services";
}

function navigateToGRNServiceApprovalConfiguration() {
    var base = sessionStorage.getItem("AppBaseURL") || (window.location.origin + "/");
    base = base.replace(/\/?$/, "/");
    window.location.href =
        base + "PurchaseTransactions/GRNService/GRNServiceApprovalConfiguration?ModuleDesp=GRN%20Services";
}

function clearGRNListGridEmptyMessage() {
    window.filteredData_grnListTable = [];
    window.filteredDataTemp_grnListTable = [];
    window.currentPage_grnListTable = 1;
    var colCount = $("#grnListTable-hader th:visible").length;
    if (!colCount) colCount = 1;
    $("#grnListTbody-body").html(
        '<tr><td colspan="' +
            colCount +
            '" style="text-align:center;padding:28px;color:#6b7280;">No data found</td></tr>'
    );
    $("#grnListTable-hader").find("th span.filter-table-heading .fa-filter").remove();
    if (typeof window.updatePageInfo === "function") window.updatePageInfo("grnListTable");
    if (typeof window.updateButtons === "function") window.updateButtons("grnListTable");
    if (typeof window.updateFilteredClass === "function") window.updateFilteredClass("grnListTbody-body");
}

function refreshGRNListGrid() {
    var master = grnMasterSourceRows || [];
    updateGrnListStatChips();
    if (master.length === 0) {
        clearGRNListGridEmptyMessage();
        return;
    }

    var mapped = mapGRNRowsToGrid(master.slice());

    const StringFilterColumn = ["Bill No", "Party Name", "Sub Project", "Project"];
    const NumericFilterColumn = ["MRN No"];
    const DateFilterColumn = ["Bill Date", "Receive Date"];
    const Button = false;
    const showButtons = [];
    const StringdoubleFilterColumn = [];
    const hiddenColumns = getGRNListHiddenColumns();
    const ColumnAlignment = getGRNListColumnAlignment();

    if (typeof window.columnFilters === "object" && window.columnFilters !== null) {
        window.columnFilters = {};
    }

    $("#grnListTable").show();
    BizsolCustomFilterGrid.CreateDataTable(
        "grnListTable-hader",
        "grnListTbody-body",
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
        null,
        null,
        "Search by MRN No, Bill No, Party, Project..."
    );
}

$(document).ready(async function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");
}); 
// ── DOM ready ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    if (!document.getElementById('divGRNList')) {
        return;
    }

    resolveGrnMultilevelVerificationFromStorage();

    window.AttachmentControl_onQueueChange = function (count) {
        const badge = document.getElementById('grnTempAttachBadge');
        if (!badge) return;
        badge.textContent = String(count);
        badge.style.display = count > 0 ? 'inline-flex' : 'none';
        syncGrnFooterAttachmentButtonState(count);
    };

    document.addEventListener('bizsol:attachmentcontrol:changed', function (ev) {
        const d = ev.detail;
        if (!d || d.tempMode) return;
        if (d.masterTableName !== 'MRNMaster') return;
        if (typeof window.loadGRNList === 'function') window.loadGRNList();
    });

    await Promise.all([
        loadVendorList(),
        loadBankList(),
        initProjectDropdownEmpty(),
    ]);
    await Promise.all([
        resolveGRNVerifyRight(),
        resolveGrnEditAfterVerificationRight(),
    ]);
    initGrnListFilters();
    await loadGrnListStatusDropdown();
    await loadGRNList();
    showListView();

    if (typeof jQuery !== "undefined") {
        jQuery(document).on("click", ".grn-verify-status--done", function (e) {
            e.preventDefault();
            e.stopPropagation();
            showGrnVerifyDetailFromBadge(this);
        });
        jQuery(document).on("keydown", ".grn-verify-status--done", function (e) {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                showGrnVerifyDetailFromBadge(this);
            }
        });
    }

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeGrnVerifyDetailPopover();
    });
    window.addEventListener("resize", function () {
        if (grnVerifyPopoverOpenAnchor) {
            positionGrnVerifyPopoverNear(grnVerifyPopoverOpenAnchor);
        }
    });

    // Allow only positive numbers with decimals in amount fields
    ['txtTotalBillAmountManual', 'txtTDSAmount', 'txtDedution'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('keypress', e => {
            const ch = e.key;
            if (ch.length !== 1) return;
            if (!/[\d.]/.test(ch)) { e.preventDefault(); return; }
            if (ch === '.' && el.value.includes('.')) e.preventDefault();
        });
        el.addEventListener('input', () => {
            el.value = el.value.replace(/[^\d.]/g, '').replace(/(\..*?)\..*/g, '$1');
            calcNetPayable();
        });
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// VIEW TOGGLE
// ══════════════════════════════════════════════════════════════════════════════
function showListView() {
    const approvalEl = document.getElementById('divGRNApprovalView');
    if (approvalEl) approvalEl.style.display = 'none';
    document.getElementById('divGRNList').style.display = 'block';
    document.getElementById('divGRNForm').style.display = 'none';
    document.getElementById('floatBar').style.display   = 'none';
}

function showFormView() {
    const approvalEl = document.getElementById('divGRNApprovalView');
    if (approvalEl) approvalEl.style.display = 'none';
    document.getElementById('divGRNList').style.display = 'none';
    document.getElementById('divGRNForm').style.display = 'block';
    document.getElementById('floatBar').style.display   = 'flex';
    syncFloatBarMargin();
    showFillGridCheckbox(!editMode);
    syncGrnFooterAttachmentButtonState();
}

function showApprovalView() {
    showApprovalViewOnly();
    applyMrnApprovalDefaultPendingStatus(true);
    if (typeof window.reloadMrnApprovalView === 'function') {
        window.reloadMrnApprovalView({
            pendingOnMe: (function () {
                try {
                    var v = sessionStorage.getItem(GRN_MRN_APPROVAL_LANDING_PENDING_ON_ME_KEY);
                    return v === 'Y' || v === '1';
                } catch (e) {
                    return false;
                }
            })(),
        });
    } else if (typeof window.refreshMrnApprovalListIfNeeded === 'function') {
        window.refreshMrnApprovalListIfNeeded(true);
    } else if (typeof window.LoadPaymentList === 'function') {
        window.LoadPaymentList();
    }
}

/** MRN approval — static status dropdown; default Pending (Y). */
function applyMrnApprovalDefaultPendingStatus(force) {
    var ddl = document.getElementById('gpaDdlStatus');
    if (!ddl) return;
    if (!force && ddl.value && ddl.value !== 'A') return;
    if (Array.from(ddl.options).some(function (o) { return o.value === 'Y'; })) {
        ddl.value = 'Y';
    }
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

async function loadVendorList() {
    const ddl = document.getElementById('ddlPartyName');
    if (!ddl) return;
    try {
        const result = await GRNService.GetVendor();
        const rows = normalizeApiRows(result);
        grnVendorListCache = rows;
        ddl.innerHTML = '<option value="">-- Select Party --</option>';
        rows.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.VendorMaster_Code ?? v.vendorMaster_Code ?? v.Code ?? '';
            opt.text  = v.VendorName        ?? v.vendorName        ?? v.Name ?? '';
            const acc = v.AccountMaster_Code ?? v.accountMaster_Code;
            if (acc !== undefined && acc !== null && `${acc}`.trim() !== '') {
                opt.dataset.accountCode = String(acc);
            }
            const partyMc = v.PartyMaster_Code ?? v.partyMaster_Code;
            if (partyMc !== undefined && partyMc !== null && `${partyMc}`.trim() !== '') {
                opt.dataset.partyMasterCode = String(partyMc);
            }
            ddl.appendChild(opt);
        });
    } catch (e) {
        console.error('Failed to load vendors:', e);
        grnVendorListCache = [];
    }
}

function grnGetSelectedVendorRecord(ddlVal) {
    const val = ddlVal !== undefined && ddlVal !== null ? String(ddlVal).trim() : '';
    if (!val) return null;
    for (let i = 0; i < (grnVendorListCache || []).length; i++) {
        const v = grnVendorListCache[i];
        const vc = String(v.VendorMaster_Code ?? v.vendorMaster_Code ?? v.Code ?? v.code ?? '');
        const ac = String(v.AccountMaster_Code ?? v.accountMaster_Code ?? '');
        const pm = String(v.PartyMaster_Code ?? v.partyMaster_Code ?? '');
        if (vc === val || ac === val || (pm && pm === val)) return v;
    }
    return null;
}

/** All plausible party codes to try for GetPOList (party master first, then vendor / account). */
function grnPartyCodesForPoListApi(explicitCode) {
    const codes = [];
    const add = (v) => {
        const s = v !== undefined && v !== null ? String(v).trim() : '';
        if (s && s !== '0' && !codes.includes(s)) codes.push(s);
    };
    const ddl = document.getElementById('ddlPartyName');
    const ddlVal = explicitCode !== undefined && explicitCode !== null
        ? String(explicitCode).trim()
        : (ddl?.value ?? '').trim();
    const selOpt = ddl?.selectedOptions?.[0];
    add(selOpt?.dataset?.partyMasterCode);
    const vendor = grnGetSelectedVendorRecord(ddlVal);
    if (vendor) {
        add(vendor.PartyMaster_Code ?? vendor.partyMaster_Code);
        add(vendor.VendorMaster_Code ?? vendor.vendorMaster_Code ?? vendor.Code ?? vendor.code);
        add(vendor.AccountMaster_Code ?? vendor.accountMaster_Code);
    }
    add(explicitCode);
    add(ddlVal);
    add(selOpt?.dataset?.accountCode);
    return codes;
}

function normalizePoListApiRows(result) {
    let rows = normalizeApiRows(result);
    if ((!rows || !rows.length) && result && typeof result === 'object') {
        const datum = result.Data ?? result.data ?? result.Result ?? result.result ?? null;
        const sources = [result, datum].filter(Boolean);
        const keys = ['POList', 'poList', 'PoList', 'PurchaseOrderList', 'purchaseOrderList', 'List', 'list', 'Table', 'table', 'Tables', 'tables', 'value', 'Value'];
        for (let s = 0; s < sources.length && !rows.length; s++) {
            const src = sources[s];
            for (let k = 0; k < keys.length; k++) {
                const arr = src[keys[k]];
                if (Array.isArray(arr) && arr.length) {
                    rows = arr;
                    break;
                }
            }
            if (!rows.length && Array.isArray(src?.Tables) && src.Tables.length) {
                rows = src.Tables[0];
            }
            if (!rows.length && Array.isArray(src?.tables) && src.tables.length) {
                rows = src.tables[0];
            }
        }
    }
    if (!Array.isArray(rows)) rows = [];
    return rows.map(function (r) {
        if (typeof r === 'string' || typeof r === 'number') return { PONo: String(r).trim() };
        return r;
    }).filter(function (r) {
        return r && typeof r === 'object';
    });
}

function grnPoNoFromRecord(r) {
    if (!r || typeof r !== 'object') return '';
    const flat = r.PONo ?? r.pONo ?? r.PoNO ?? r.PoNo ?? r.PO_No ?? r.poNo ?? r.PO_NO
        ?? r.PONumber ?? r.poNumber ?? r.PurchaseOrderNo ?? r.purchaseOrderNo ?? '';
    if (flat !== undefined && flat !== null && String(flat).trim() !== '') return String(flat).trim();
    const pom = r.PurchaseOrderMaster ?? r.purchaseOrderMaster;
    if (pom && typeof pom === 'object') {
        const v = pom.PONo ?? pom.pONo ?? pom.PoNO ?? pom.PO_No ?? pom.poNo ?? '';
        if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
}

function grnPoCodeFromRecord(r) {
    if (!r || typeof r !== 'object') return '';
    const pom = r.PurchaseOrderMaster ?? r.purchaseOrderMaster;
    if (pom && typeof pom === 'object') {
        const v = pom.Code ?? pom.code ?? pom.PurchaseOrderMaster_Code ?? pom.purchaseOrderMaster_Code ?? '';
        if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    }
    const v = r.PurchaseOrderMaster_Code ?? r.purchaseOrderMaster_Code
        ?? r.PO_Code ?? r.po_Code ?? r.PurchaseOrder_Code ?? r.purchaseOrder_Code ?? r.Code ?? r.code ?? '';
    return v !== undefined && v !== null && String(v).trim() !== '' ? String(v).trim() : '';
}

function grnNormalizePoListRow(r) {
    const code = grnPoCodeFromRecord(r);
    const text = grnPoNoFromRecord(r) || (code ? `PO-${code}` : '');
    return {
        PurchaseOrderMaster_Code: code,
        PoNO: text,
    };
}

async function fetchGrnPoListFromApi(codes) {
    const tried = new Set();
    for (let i = 0; i < codes.length; i++) {
        const c = String(codes[i] ?? '').trim();
        if (!c || c === '0' || tried.has(c)) continue;
        tried.add(c);
        try {
            const result = await GRNService.GetPOList(c);
            const rows = normalizePoListApiRows(result);
            if (rows.length) {
                return rows.map(grnNormalizePoListRow).filter(po => po.PurchaseOrderMaster_Code || po.PoNO);
            }
        } catch (e) {
            console.warn('fetchGrnPoListFromApi', c, e);
        }
    }
    return [];
}

function normalizeGrnBankListRows(result) {
    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (Array.isArray(result.Data)) return result.Data;
    if (Array.isArray(result.data)) return result.data;
    return [];
}

async function loadBankList() {
    const ddl = document.getElementById('ddlBankName');
    if (!ddl) return;
    try {
        const result = await GRNService.GetBankList();
        const rows = normalizeGrnBankListRows(result);
        ddl.innerHTML = '<option value="">-- Select Bank --</option>';
        rows.forEach(b => {
            const opt = document.createElement('option');
            const code = b.Code ?? b.BankMaster_Code ?? b.code ?? b.bankMaster_Code ?? '';
            opt.value = code !== '' && code !== null && code !== undefined ? String(code) : '';
            opt.text = String((b.BankName ?? b.bankName ?? b.Name ?? '').trim() || opt.value || '');
            ddl.appendChild(opt);
        });
    } catch (e) {
        console.error('Failed to load banks:', e);
    }
}

//function getSelectedBankNameForSave() {
//    const ddl = document.getElementById('ddlBankName');
//    if (!ddl || ddl.selectedIndex < 0) return '';
//    const opt = ddl.options[ddl.selectedIndex];
//    const v = (ddl.value || '').trim();
//    if (!v) return '';
//    return ((opt && opt.text) ? opt.text : '').trim();
//}

function getAuthUserMasterCode() {
    try {
        const raw = sessionStorage.getItem('authKey');
        if (!raw) return 0;
        const auth = JSON.parse(raw);
        const c = auth.UserMaster_Code ?? auth.userMaster_Code;
        const n = parseInt(c, 10);
        return Number.isFinite(n) ? n : 0;
    } catch (e) {
        return 0;
    }
}

function normalizeApiRows(result) {
    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (Array.isArray(result.MRNStatusList)) return result.MRNStatusList;
    if (Array.isArray(result.mrnStatusList)) return result.mrnStatusList;
    if (Array.isArray(result.StatusList)) return result.StatusList;
    if (Array.isArray(result.statusList)) return result.statusList;
    if (Array.isArray(result.Data)) return result.Data;
    if (Array.isArray(result.data)) return result.data;
    const datum = result.Data ?? result.data;
    if (datum && typeof datum === 'object' && !Array.isArray(datum)) {
        const inner = normalizeApiRows(datum);
        if (inner.length) return inner;
    }
    if (Array.isArray(result.Table)) return result.Table;
    if (Array.isArray(result.table)) return result.table;
    return [];
}

/** Bind approval Status filter — default Pending on MRN approval page. */
function loadGrnApprovalStatusDropdown() {
    return bindGrnStatusDropdown('gpaDdlStatus', { allValue: 'A', defaultValue: 'Y', preferDefault: true });
}

/** Bind GRN list Status filter — default All Status (0) on GRN Service list. */
function loadGrnListStatusDropdown() {
    return bindGrnStatusDropdown('lstDdlStatus', { allValue: '0', defaultValue: '0' });
}

/** Resolve dropdown option value by status kind (pending / approved / rejected / all). */
function resolveGrnDropdownStatusCode(selectEl, kind) {
    if (!selectEl || !selectEl.options || !selectEl.options.length) return null;
    const want = String(kind || '').toLowerCase();
    const codeHints = {
        pending: ['y', 'n', 'u'],
        approved: ['p'],
        rejected: ['r'],
        all: ['0', 'a'],
    };
    const hints = codeHints[want] || [];
    for (let i = 0; i < selectEl.options.length; i++) {
        const opt = selectEl.options[i];
        const v = String(opt.value || '').trim().toLowerCase();
        const t = String(opt.text || '').trim().toLowerCase();
        if (hints.indexOf(v) >= 0) return opt.value;
        if (want === 'pending' && t.indexOf('pending') >= 0 && t.indexOf('on me') < 0) return opt.value;
        if (want === 'approved' && t.indexOf('approved') >= 0) return opt.value;
        if (want === 'rejected' && t.indexOf('reject') >= 0) return opt.value;
        if (want === 'all' && (t.indexOf('all status') >= 0 || t === 'all')) return opt.value;
    }
    return null;
}

function bindGrnStatusDropdown(selectId, options) {
    options = options || {};
    const allValue = String(options.allValue != null ? options.allValue : '0');
    const defaultValue = String(options.defaultValue != null ? options.defaultValue : allValue);
    const statusEl = document.getElementById(selectId);
    if (!statusEl) return Promise.resolve();
    const prev = (statusEl.value || defaultValue).trim();
    const allText = '-- All Status --';
    return GRNService.LoadStatusDropdown()
        .then(function (response) {
            const rows = normalizeApiRows(response);
            let html = `<option value="${allValue}">${allText}</option>`;
            rows.forEach(function (s) {
                const code = String(s.Code ?? s.code ?? s.Value ?? s.value ?? s.Status ?? s.status ?? '').trim();
                const name = String(s.Name ?? s.name ?? s.Text ?? s.text ?? s.Description ?? s.description ?? code).trim();
                if (!code || code === allValue) return;
                html += `<option value="${code}">${name}</option>`;
            });
            statusEl.innerHTML = html;
            if (options.preferDefault) {
                const pendingCode = resolveGrnDropdownStatusCode(statusEl, 'pending')
                    || defaultValue;
                const hasTarget = Array.from(statusEl.options).some(function (o) { return o.value === pendingCode; });
                statusEl.value = hasTarget ? pendingCode : defaultValue;
            } else {
                const hasPrev = Array.from(statusEl.options).some(function (o) { return o.value === prev; });
                statusEl.value = hasPrev ? prev : defaultValue;
            }
        })
        .catch(function () {
            statusEl.innerHTML = `<option value="${allValue}">${allText}</option>`;
            statusEl.value = defaultValue;
        });
}

/** Placeholder only — projects load only after Sub Project is chosen (see fillProjectFromSubProject). */
function initProjectDropdownEmpty() {
    const ddl = document.getElementById('frmDdlProject');
    if (!ddl) return;
    ddl.innerHTML = '<option value="">-- Select Project --</option>';
    ddl.disabled = false;
}

async function fillProjectFromSubProject(subProjectMasterCode) {
    const ddl = document.getElementById('frmDdlProject');
    if (!ddl) return;

    ddl.innerHTML = '<option value="">-- Select Project --</option>';
    const code = String(subProjectMasterCode || '').trim();
    if (!code) {
        ddl.disabled = false;
        return;
    }

    try {
        const raw = await GRNService.GetProjectList(code);
        const rows = normalizeApiRows(raw);
        rows.forEach(p => {
            const opt = document.createElement('option');
            opt.value = String(p.ProjectMaster_Code ?? p.projectMaster_Code ?? p.Code ?? '');
            opt.text  = String(p.ProjectName ?? p.projectName ?? p.Name ?? '').trim() || opt.value;
            ddl.appendChild(opt);
        });

        if (rows.length === 1) {
            const only = rows[0];
            ddl.value = String(only.ProjectMaster_Code ?? only.projectMaster_Code ?? only.Code ?? '');
        }
        ddl.disabled = false;
    } catch (e) {
        console.error('fillProjectFromSubProject:', e);
        ddl.disabled = false;
    }
}

/** Sub projects assigned to the logged-in user (API: UserMaster_Code). Called after Party / Against Project context is set — not on initial page load. */
async function loadSubProjectsForParty() {
    const subDdl = document.getElementById('frmDdlSubProject');
    const projDdl = document.getElementById('frmDdlProject');
    if (!subDdl || !projDdl) return;

    subDdl.innerHTML = '<option value="">-- Select Sub Project --</option>';
    projDdl.innerHTML = '<option value="">-- Select Project --</option>';
    projDdl.disabled = false;

    document.getElementById('itemTbody').innerHTML = '';
    rowIndex = 0;
    projectItemsCache = [];
    calcTotal();

    const partyVal = document.getElementById('ddlPartyName')?.value?.trim();
    const isAgainstProject = document.getElementById('chkAgainstProject')?.checked;

    if (!isAgainstProject || !partyVal) {
        showGridProjectHint();
        setAddItemBtnState(false);
        return;
    }

    const userCode = getAuthUserMasterCode();
    if (!userCode) {
        showToast('Login session missing UserMaster_Code.', 'warning');
        showGridProjectHint();
        setAddItemBtnState(false);
        return;
    }

    try {
        const raw = await GRNService.GetSubProjectList(userCode);
        const rows = normalizeApiRows(raw);
        rows.forEach(s => {
            const opt = document.createElement('option');
            opt.value = String(s.SubProjectMaster_Code ?? s.subProjectMaster_Code ?? s.Code ?? '');
            opt.text  = String(s.SubProjectName ?? s.subProjectName ?? s.Name ?? '').trim() || opt.value;
            subDdl.appendChild(opt);
        });
    } catch (e) {
        console.error('Failed to load sub-projects:', e);
    }

    showGridProjectHint();
    setAddItemBtnState(false);
}

async function reloadAgainstProjectGridIfReady() {
    const projectCode = document.getElementById('frmDdlProject')?.value;
    const subProjectCode = document.getElementById('frmDdlSubProject')?.value;

    document.getElementById('itemTbody').innerHTML = '';
    rowIndex = 0;
    projectItemsCache = [];

    if (!projectCode || !subProjectCode) {
        showGridProjectHint();
        setAddItemBtnState(false);
        return;
    }

    setAddItemBtnState(true);
    if (isFillGridChecked()) {
        const partyMaster_Code = document.getElementById('ddlPartyName')?.value;
        await loadItemsByProject(projectCode, subProjectCode, partyMaster_Code);
    } else {
        document.getElementById('itemTbody').innerHTML = '';
        rowIndex = 0;
        addItemRow();
        loadAllPOs();
    }
}

function isFillGridChecked() {
    const chk = document.getElementById('chkFillGrid');
    return chk ? chk.checked : true;
}

function showFillGridCheckbox(show) {
    const div = document.getElementById('divFillGridCheck');
    if (div) {
        const visible = show && !editMode;
        div.style.setProperty('display', visible ? 'flex' : 'none', 'important');
    }
}

async function onPartyChange() {
    updateProjectFieldsState();

    document.getElementById('itemTbody').innerHTML = '';
    rowIndex = 0;
    projectItemsCache = [];

    const against = document.getElementById('chkAgainstProject')?.checked;
    const partySel = document.getElementById('ddlPartyName')?.value?.trim();

    await loadPOsForParty(partySel);

    if (against && partySel) {
        await loadSubProjectsForParty();
    }

    if (!isFillGridChecked()) {
        addItemRow();
        loadAllPOs();
        calcTotal();
        updateMobileCards();
        return;
    }

    const projectCode      = document.getElementById('frmDdlProject')?.value;
    const subProjectCode   = document.getElementById('frmDdlSubProject')?.value;
    const partyMaster_Code = document.getElementById('ddlPartyName')?.value;

    if (against && projectCode && subProjectCode && partyMaster_Code) {
        await loadItemsByProject(projectCode, subProjectCode, partyMaster_Code);
    } else if (!against) {
        addItemRow();
    } else {
        showGridProjectHint();
        setAddItemBtnState(false);
    }
}

function onFillGridChange() {
    const projectCode = document.getElementById('frmDdlProject')?.value;
    const subProjectCode = document.getElementById('frmDdlSubProject')?.value;
    const partyMaster_Code = document.getElementById('ddlPartyName')?.value;
    if (isFillGridChecked() && projectCode && subProjectCode && partyMaster_Code) {
        loadItemsByProject(projectCode, subProjectCode, partyMaster_Code);
    } else if (!isFillGridChecked()) {
        document.getElementById('itemTbody').innerHTML = '';
        rowIndex = 0;
        document.getElementById('trProjectHint')?.remove();
        addItemRow();
        loadAllPOs();
        calcTotal();
        updateMobileCards();
    }
}

function addRowDirectToGrid() {
    document.getElementById('trProjectHint')?.remove();
    addItemRow();
}

function onAddItemClick() {
    openAddItemModalForm();
}

function showGridProjectHint() {
    const tbody = document.getElementById('itemTbody');
    if (!tbody) return;
    tbody.innerHTML = `
        <tr id="trProjectHint">
            <td colspan="12" style="text-align:center;padding:18px 10px;">
                <div style="display:inline-flex;align-items:center;gap:10px;
                            background:linear-gradient(135deg,rgba(13,202,240,0.08),rgba(8,145,178,0.06));
                            border:1px dashed rgba(13,202,240,0.45);border-radius:10px;
                            padding:12px 20px;">
                    <i class="fa fa-info-circle" style="color:#0dcaf0;font-size:1.1rem;"></i>
                    <span style="font-size:0.82rem;color:#475569;">
                        Please select <strong style="color:#0891b2;">Party Name</strong>,
                        then <strong style="color:#0891b2;">Sub Project</strong>
                        (Project fills automatically), to load items.
                    </span>
                </div>
            </td>
        </tr>`;
    calcTotal();
    updateMobileCards();
}

function setAddItemBtnState(enabled) {
    // Add Item button removed - Add Row modal is used instead
}

function updateProjectFieldsState() {
    const partyVal = document.getElementById('ddlPartyName')?.value;
    const projDdl = document.getElementById('frmDdlProject');
    const subDdl  = document.getElementById('frmDdlSubProject');
    const hasParty = !!partyVal;

    if (subDdl) {
        subDdl.disabled = !hasParty;
        if (!hasParty) {
            subDdl.innerHTML = '<option value="">-- Select Sub Project --</option>';
        }
    }
    if (projDdl) {
        if (!hasParty) {
            projDdl.innerHTML = '<option value="">-- Select Project --</option>';
        }
        projDdl.disabled = false;
    }
}

function onProjectFieldFocus(el) {
    const partyVal = document.getElementById('ddlPartyName')?.value;
    if (!partyVal) {
        showToast('Please select Party Name first.', 'warning');
        el.blur();
        document.getElementById('ddlPartyName')?.focus();
        return;
    }
    if (el && el.id === 'frmDdlProject') {
        const subVal = document.getElementById('frmDdlSubProject')?.value;
        if (!subVal) {
            showToast('Please select Sub Project first.', 'warning');
            el.blur();
            document.getElementById('frmDdlSubProject')?.focus();
        }
    }
}

function toggleProjectFields(chk) {
    const fields = document.getElementById('divProjectFields');
    const hint   = document.getElementById('divProjectHint');

    if (chk.checked) {
        if (fields) fields.style.display = 'block';
        if (hint)   hint.style.display   = 'none';
        poList = [];
        projectItemsCache = [];
        rowIndex = 0;
        updateProjectFieldsState();
        void loadSubProjectsForParty();
    } else {
        if (fields) fields.style.display = 'none';
        if (hint)   hint.style.display   = 'block';
        initProjectDropdownEmpty();
        document.getElementById('frmDdlSubProject').innerHTML =
            '<option value="">-- Select Sub Project --</option>';
        setAddItemBtnState(true);
        document.getElementById('itemTbody').innerHTML = '';
        rowIndex = 0;
        addItemRow();
        loadAllPOs();
    }
}

async function onSubProjectChange() {
    document.getElementById('frmDdlSubProject')?.classList.remove('is-invalid');

    const subProjectCode = document.getElementById('frmDdlSubProject')?.value;
    await fillProjectFromSubProject(subProjectCode);

    await reloadAgainstProjectGridIfReady();
}

async function onProjectChange() {
    await reloadAgainstProjectGridIfReady();
}

async function loadItemsByProject(projectCode, subProjectCode, partyMaster_Code) {
    showToast('Loading items for selected project...', 'info');

    try {
        const result = await GRNService.GetPOItemDetails(projectCode, subProjectCode, partyMaster_Code);
        projectItemsCache = result || [];

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

            // ── Item dropdown — SQL returns: ItemMaster_Code, ItemName, UOMMaster_Code, UOM ───
            const itSel    = tr.querySelector('.item-select');
            const itemCode = item.ItemMaster_Code ?? item.Item_Code ?? '';
            const itemName = item.ItemName        ?? item.Item_Name ?? '';
            const uomMasterCode = String(item.UOMMaster_Code ?? item.uomMaster_Code ?? '');
            const itemUom = item.UOM ?? item.uom ?? item.Uom ?? uomMasterCode;
            const rate     = parseFloat(item.Rate ?? 0);
            const poTranCode = item.PurchaseOrderTransaction_Code ?? item.PurchaseOrderTransactionCode ?? item.code ?? item.Code ?? '';
            if (itSel && itemCode) {
                itSel.innerHTML = '';
                const opt        = document.createElement('option');
                opt.value        = itemCode;
                opt.text         = itemName;
                opt.dataset.rate = rate;
                opt.dataset.uom  = itemUom;
                opt.dataset.uomMasterCode = uomMasterCode;
                opt.dataset.purchaseOrderTransactionCode = String(poTranCode);
                itSel.appendChild(opt);
                itSel.value = itemCode;
            }

            // ── UOM bind (grid uses uom-cell readonly; save uses tr.dataset.uomMasterCode) ──
            const uomCell = tr.querySelector('.uom-cell');
            if (uomCell) uomCell.value = itemUom || '';
            if (uomMasterCode) tr.dataset.uomMasterCode = String(uomMasterCode);

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

            // Store PurchaseOrderTransaction_Code for save (backend needs it to update MRNQtyMT)
            if (poTranCode) {
                tr.dataset.purchaseOrderTransactionCode = String(poTranCode);
                const hf = tr.querySelector('.hf-purchase-order-transaction-code');
                if (hf) hf.value = String(poTranCode);
            }

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

async function loadPOsForParty(partyCode) {
    const code = partyCode !== undefined && partyCode !== null
        ? String(partyCode).trim()
        : (document.getElementById('ddlPartyName')?.value?.trim() ?? '');

    if (!code) {
        poList = [];
        refreshAllPODropdowns();
        return;
    }

    try {
        const codes = grnPartyCodesForPoListApi(code);
        poList = await fetchGrnPoListFromApi(codes);
        refreshAllPODropdowns();
    } catch (e) {
        console.error('Failed to load PO list for party:', e);
        poList = [];
        refreshAllPODropdowns();
    }
}

/** @deprecated Use loadPOsForParty — kept for existing callers. */
async function loadAllPOs() {
    return loadPOsForParty();
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
            <input type="text" class="form-control form-control-sm uom-cell"  placeholder="--" style="background:#f1f5f9;">
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
            <input type="number" class="form-control form-control-sm shortage-qty" readonly
                   min="0" step="any" placeholder="0"
                   style="background:#f1f5f9;cursor:not-allowed;">
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
            <input type="hidden" class="hf-purchase-order-transaction-code" value="">
        </td>
        <td style="text-align:center;">
            <button type="button" class="del-row-btn" onclick="removeItemRow(this)" title="Delete Row">
                <i class="fa fa-trash"></i>
            </button>
        </td>
        `;
    tbody.appendChild(tr);

    // Fill PO dropdown: from poList or projectItemsCache (when Against Project ON)
    const poSel = tr.querySelector('.po-select');
    const isAgainstProject = document.getElementById('chkAgainstProject')?.checked;
    const projectCode = document.getElementById('frmDdlProject')?.value;
    const subProjectCode = document.getElementById('frmDdlSubProject')?.value;
    if (isAgainstProject && projectCode && subProjectCode && projectItemsCache.length > 0) {
        const poMap = new Map();
        projectItemsCache.forEach(item => {
            const code = item.PurchaseOrderMaster_Code ?? item.PurchaseOrder_Code ?? '';
            const text = item.PoNO ?? item.PONo ?? item.PO_No ?? '';
            if (code && !poMap.has(code)) poMap.set(code, text || `PO-${code}`);
        });
        poMap.forEach((text, code) => {
            poSel.add(new Option(text, code));
        });
    } else {
        poList.forEach(po => {
            const opt = document.createElement('option');
            opt.value = po.PurchaseOrderMaster_Code ?? po.PurchaseOrder_Code ?? po.Code ?? '';
            opt.text  = po.PoNO ?? po.PO_No ?? po.PONo ?? po.PONumber ?? '';
            poSel.appendChild(opt);
        });
    }

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

function showAllItems() {
    calcTotal();
    updateMobileCards();
    renumberRows();
    showToast('Showing all items.', 'info');
}

let addItemModalPOItemData = [];
let addItemModalUsePOList  = false;

async function openAddItemModalForm() {
    const isAgainstProject = document.getElementById('chkAgainstProject')?.checked;
    const projectCode     = document.getElementById('frmDdlProject')?.value;
    const subProjectCode  = document.getElementById('frmDdlSubProject')?.value;
    const partyMaster_Code = document.getElementById('ddlPartyName')?.value;
    const hintEl          = document.getElementById('addItemModalHint');
    const formEl          = document.getElementById('addItemModalForm');

    resetAddItemModalForm();

    if (!editMode && isAgainstProject && (!partyMaster_Code || !projectCode || !subProjectCode) && isFillGridChecked()) {
        if (hintEl) hintEl.style.display = 'block';
        const hintText = document.getElementById('addItemModalHintText');
        if (hintText) hintText.textContent = 'Please select Party Name and Sub Project first (Project fills automatically).';
        if (formEl) formEl.style.display = 'none';
    } else {
        if (hintEl) hintEl.style.display = 'none';
        if (formEl) formEl.style.display = 'block';
        const poSel = document.getElementById('addItemModalPO');
        const itemSel = document.getElementById('addItemModalItem');
        if (poSel) poSel.innerHTML = '<option value="">-- Select PO --</option>';
        if (itemSel) itemSel.innerHTML = '<option value="">-- Select Item --</option>';

        if (isAgainstProject && partyMaster_Code && projectCode && subProjectCode) {
            addItemModalUsePOList = false;
            try {
                const result = await GRNService.GetPOItemDetails(projectCode, subProjectCode, partyMaster_Code);
                addItemModalPOItemData = result || [];
                const poMap = new Map();
                addItemModalPOItemData.forEach(item => {
                    const code = item.PurchaseOrderMaster_Code ?? item.PurchaseOrder_Code ?? '';
                    const text = item.PoNO ?? item.PONo ?? item.PO_No ?? '';
                    if (code && !poMap.has(code)) poMap.set(code, text || `PO-${code}`);
                });
                poMap.forEach((text, code) => { if (poSel) poSel.add(new Option(text, code)); });
            } catch (e) {
                showToast('Failed to load PO items.', 'error');
            }
        } else {
            addItemModalUsePOList = true;
            const partyVal = document.getElementById('ddlPartyName')?.value?.trim();
            if (!partyVal) {
                if (hintEl) {
                    hintEl.style.display = 'block';
                    const hintText = document.getElementById('addItemModalHintText');
                    if (hintText) hintText.textContent = 'Please select Party Name first to load PO list.';
                }
                if (formEl) formEl.style.display = 'none';
            } else {
                try {
                    await loadPOsForParty(partyVal);
                    poList.forEach(po => {
                        const code = po.PurchaseOrderMaster_Code ?? po.PurchaseOrder_Code ?? po.Code ?? '';
                        const text = po.PoNO ?? po.PO_No ?? po.PONo ?? po.PONumber ?? '';
                        if (code && poSel) poSel.add(new Option(text, code));
                    });
                } catch (e) {
                    showToast('Failed to load PO list for party.', 'error');
                }
            }
        }
    }

    new bootstrap.Modal(document.getElementById('addItemModal')).show();
}

function resetAddItemModalForm() {
    const po = document.getElementById('addItemModalPO');
    const item = document.getElementById('addItemModalItem');
    if (po) po.value = '';
    if (item) item.innerHTML = '<option value="">-- Select Item --</option>';
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    set('addItemModalUOM', '');
    set('addItemModalBillQty', '0');
    set('addItemModalAcceptQty', '0');
    set('addItemModalRejectQty', '0');
    set('addItemModalShortage', '0');
    set('addItemModalRate', '0');
    set('addItemModalAmount', '0.00');
    set('addItemModalRemark', '');
}

async function onAddItemModalPOChange() {
    const poCode = document.getElementById('addItemModalPO')?.value;
    const itemSel = document.getElementById('addItemModalItem');
    itemSel.innerHTML = '<option value="">-- Select Item --</option>';
    document.getElementById('addItemModalRate').value = '0';
    document.getElementById('addItemModalBillQty').value = '0';
    calcAddItemModalAmount();

    if (!poCode) return;

    let filtered = [];
    if (addItemModalUsePOList) {
        try {
            itemSel.innerHTML = '<option value="">Loading…</option>';
            const result = await GRNService.GetPOItemsByPO(poCode);
            filtered = result || [];
            itemSel.innerHTML = '<option value="">-- Select Item --</option>';
        } catch (e) {
            itemSel.innerHTML = '<option value="">-- Select Item --</option>';
            showToast('Failed to load items for this PO.', 'error');
            return;
        }
    } else {
        filtered = addItemModalPOItemData.filter(item =>
            String(item.PurchaseOrderMaster_Code ?? item.PurchaseOrder_Code ?? '') === String(poCode));
    }

    filtered.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.ItemMaster_Code ?? item.Item_Code ?? '';
        opt.text  = item.ItemName ?? item.Item_Name ?? '';
        const qtyMT = parseFloat(item.QtyMT ?? 0);
        const amount = parseFloat(item.Amount ?? 0);
        let rate = parseFloat(item.Rate ?? 0);
        if (rate <= 0 && qtyMT > 0 && amount > 0) rate = amount / qtyMT;
        opt.dataset.rate = rate;
        const uomMc = String(item.UOMMaster_Code ?? item.uomMaster_Code ?? '');
        opt.dataset.uom  = item.UOM ?? item.uom ?? item.Uom ?? uomMc;
        opt.dataset.uomMasterCode = uomMc;
        opt.dataset.purchaseOrderTransactionCode = item.PurchaseOrderTransaction_Code ?? item.PurchaseOrderTransactionCode ?? '';
        const mrnQtyMT = parseFloat(item.MRNQtyMT ?? 0);
        const cancelQtyMT = parseFloat(item.CancelQtyMT ?? 0);
        const pendingQty = item.PendingQty ?? (qtyMT > 0 ? Math.max(0, qtyMT - mrnQtyMT - cancelQtyMT) : 0);
        opt.dataset.pendingQty = pendingQty;
        itemSel.appendChild(opt);
    });
}

function onAddItemModalItemChange() {
    const itemSel = document.getElementById('addItemModalItem');
    const opt = itemSel?.options[itemSel.selectedIndex];
    const rate = parseFloat(opt?.dataset?.rate ?? 0);
    const pendingQty = opt?.dataset?.pendingQty ?? '';
    const uomMasterCode = opt?.dataset?.uomMasterCode ?? '';
    const uomDisplay   = opt?.dataset?.uom ?? uomMasterCode;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    set('addItemModalRate', rate > 0 ? rate.toFixed(2) : '0');
    set('addItemModalBillQty', pendingQty !== '' ? pendingQty : '0');
    set('addItemModalUOM', uomDisplay); 
    set('addItemModalAcceptQty', '0');
    set('addItemModalRejectQty', '0');
    set('addItemModalShortage', '0');
    calcAddItemModalAmount();
}

function calcAddItemModalAmount(editedInput) {
    let billQty   = parseFloat(document.getElementById('addItemModalBillQty')?.value) || 0;
    let acceptQty = parseFloat(document.getElementById('addItemModalAcceptQty')?.value) || 0;
    let rejectQty = parseFloat(document.getElementById('addItemModalRejectQty')?.value) || 0;
    const rate    = parseFloat(document.getElementById('addItemModalRate')?.value) || 0;

    const billEl   = document.getElementById('addItemModalBillQty');
    const acceptEl = document.getElementById('addItemModalAcceptQty');
    const rejectEl = document.getElementById('addItemModalRejectQty');

    // ── Validate against available pending qty (same as grid) ────────────────────
    const itemOpt = document.getElementById('addItemModalItem')?.options[document.getElementById('addItemModalItem')?.selectedIndex];
    const pendingQty = itemOpt?.dataset?.pendingQty !== undefined ? parseFloat(itemOpt.dataset.pendingQty) : null;
    if (pendingQty !== null && pendingQty >= 0) {
        if (editedInput?.id === 'addItemModalBillQty' && billQty > pendingQty) {
            showToast(`Only ${pendingQty} qty available for this PO. You cannot enter more than ${pendingQty}.`, 'warning');
            if (billEl) billEl.value = pendingQty;
            billQty = pendingQty;
        }
        if (editedInput?.id === 'addItemModalAcceptQty' && acceptQty > pendingQty) {
            showToast(`Only ${pendingQty} qty available for this PO. Accept Qty cannot exceed ${pendingQty}.`, 'warning');
            if (acceptEl) { acceptEl.value = pendingQty; acceptQty = pendingQty; }
        }
    }

    // ── Validate Accept Qty & Reject Qty cannot exceed Bill Qty ────────────────
    if (acceptEl && acceptQty > billQty) {
        showToast(`Accept Qty cannot exceed Bill Qty (${billQty}).`, 'warning');
        acceptEl.value = '0';
        acceptQty = 0;
    }
    if (rejectEl && rejectQty > billQty) {
        showToast(`Reject Qty cannot exceed Bill Qty (${billQty}).`, 'warning');
        rejectEl.value = '0';
        rejectQty = 0;
    }

    // ── Validate: Accept + Reject cannot exceed Bill Qty (same as grid) ──────────
    if (acceptQty + rejectQty > billQty) {
        if (editedInput?.id === 'addItemModalBillQty' && billEl) {
            const minBill = acceptQty + rejectQty;
            showToast(`Accept Qty + Reject Qty cannot be greater than Bill Qty. Bill Qty set to ${minBill}.`, 'warning');
            billEl.value = minBill;
            billQty = minBill;
        } else if (editedInput?.id === 'addItemModalAcceptQty' && acceptEl) {
            showToast(`Accept Qty + Reject Qty cannot be greater than Bill Qty (${billQty}).`, 'warning');
            acceptEl.value = '0';
            acceptQty = 0;
        } else if (editedInput?.id === 'addItemModalRejectQty' && rejectEl) {
            showToast(`Accept Qty + Reject Qty cannot be greater than Bill Qty (${billQty}).`, 'warning');
            rejectEl.value = '0';
            rejectQty = 0;
        } else if (rejectEl) {
            showToast(`Accept Qty + Reject Qty cannot be greater than Bill Qty (${billQty}).`, 'warning');
            rejectEl.value = '0';
            rejectQty = 0;
        }
    }

    const shortage  = Math.max(0, billQty - acceptQty - rejectQty);
    const amount    = billQty * rate;
    const shortageEl = document.getElementById('addItemModalShortage');
    const amountEl   = document.getElementById('addItemModalAmount');
    if (shortageEl) shortageEl.value = shortage;
    if (amountEl) amountEl.value = amount.toFixed(2);
}

function saveAddItemModalToGrid() {
    const poCode   = document.getElementById('addItemModalPO')?.value;
    const itemCode = document.getElementById('addItemModalItem')?.value;
    const billQty  = document.getElementById('addItemModalBillQty')?.value;
    const rate     = document.getElementById('addItemModalRate')?.value;

    if (!poCode || !itemCode) {
        showToast('Please select PO and Item.', 'warning');
        return;
    }
    const qtyNum = parseFloat(billQty) || 0;
    const rateNum = parseFloat(rate) || 0;
    if (qtyNum <= 0 || rateNum <= 0) {
        showToast('Bill Qty and Rate must be greater than 0.', 'warning');
        return;
    }

    document.getElementById('trProjectHint')?.remove();
    addItemRow();
    const tbody = document.getElementById('itemTbody');
    const tr = tbody.rows[tbody.rows.length - 1];
    const poSel = tr.querySelector('.po-select');
    const itemSel = tr.querySelector('.item-select');
    const poOpt = document.getElementById('addItemModalPO').options[document.getElementById('addItemModalPO').selectedIndex];
    const itemOpt = document.getElementById('addItemModalItem').options[document.getElementById('addItemModalItem').selectedIndex];

    if (poSel) {
        if (!Array.from(poSel.options).some(o => o.value === poCode))
            poSel.add(new Option(poOpt?.text ?? poCode, poCode));
        poSel.value = poCode;
    }
    const uomMasterCodeVal = itemOpt?.dataset?.uomMasterCode ?? '';
    const uomDisplayVal   = itemOpt?.dataset?.uom ?? document.getElementById('addItemModalUOM')?.value ?? '';

    if (itemSel) {
        itemSel.innerHTML = '';
        const opt = document.createElement('option');
        opt.value = itemCode;
        opt.text  = itemOpt?.text ?? '';
        opt.dataset.rate = rate;
        opt.dataset.uom = uomDisplayVal;
        opt.dataset.uomMasterCode = uomMasterCodeVal;
        opt.dataset.purchaseOrderTransactionCode = itemOpt?.dataset?.purchaseOrderTransactionCode ?? '';
        itemSel.appendChild(opt);
        itemSel.value = itemCode;
    }

    const setCell = (cls, val) => { const el = tr.querySelector(cls); if (el) el.value = val ?? ''; };
    const uomCell = tr.querySelector('.uom-cell');
    if (uomCell) uomCell.value = uomDisplayVal || '';
    if (uomMasterCodeVal) tr.dataset.uomMasterCode = String(uomMasterCodeVal);
    setCell('.bill-qty',   document.getElementById('addItemModalBillQty')?.value);
    setCell('.accept-qty', document.getElementById('addItemModalAcceptQty')?.value);
    setCell('.reject-qty', document.getElementById('addItemModalRejectQty')?.value);
    setCell('.shortage-qty', document.getElementById('addItemModalShortage')?.value);
    setCell('.rate',       rate);
    setCell('.row-remark', document.getElementById('addItemModalRemark')?.value ?? '');

    const poTranCode = itemOpt?.dataset?.purchaseOrderTransactionCode ?? '';
    if (poTranCode) {
        tr.dataset.purchaseOrderTransactionCode = String(poTranCode);
        const hf = tr.querySelector('.hf-purchase-order-transaction-code');
        if (hf) hf.value = String(poTranCode);
    }

    calcRowAmount(tr);
    renumberRows();
    calcTotal();
    updateMobileCards();
    updateFloatBar();

    bootstrap.Modal.getInstance(document.getElementById('addItemModal'))?.hide();
    resetAddItemModalForm();
    showToast('Item added to grid.', 'success');
}

function renumberRows() {
    document.querySelectorAll('#itemTbody tr').forEach((tr, i) => {
        const cell = tr.cells[0];
        if (cell) cell.textContent = i + 1;
    });
}

// ══════════════════════════════════════════════════════════════════════════════
// Guard — block PO interaction until Party is selected (party-based PO list)
function onPOFocus(select) {
    const partyMaster_Code = document.getElementById('ddlPartyName')?.value?.trim();
    if (!partyMaster_Code) {
        showToast('Please select Party Name first.', 'warning');
        select.blur();
        document.getElementById('ddlPartyName')?.focus();
        return;
    }

    const isAgainstProject = document.getElementById('chkAgainstProject')?.checked;
    if (!isAgainstProject) return;

    const projectCode     = document.getElementById('frmDdlProject')?.value;
    const subProjectCode  = document.getElementById('frmDdlSubProject')?.value;

    if (!subProjectCode) {
        showToast('Please select Sub Project first.', 'warning');
        select.blur();
        document.getElementById('frmDdlSubProject')?.focus();
        return;
    }
    if (!projectCode) {
        showToast('Project could not be resolved; choose Sub Project again.', 'warning');
        select.blur();
        document.getElementById('frmDdlSubProject')?.focus();
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

    // Read party, project + sub-project from the page-level selects
    const partyMaster_Code = document.getElementById('ddlPartyName')?.value || '';
    const projectCode     = document.getElementById('frmDdlProject')?.value;
    const subProjectCode  = document.getElementById('frmDdlSubProject')?.value;

    // Need party + project + sub to call the API
    if (!partyMaster_Code) {
        showToast('Please select Party Name first.', 'warning');
        select.value = '';
        document.getElementById('ddlPartyName')?.focus();
        return;
    }
    if (!subProjectCode || !projectCode) {
        showToast('Please select Sub Project first (Project fills automatically).', 'warning');
        select.value = '';
        document.getElementById('frmDdlSubProject')?.focus();
        return;
    }
    itemSel.innerHTML = '<option value="">Loading…</option>';
    itemSel.disabled  = true;

    try {
        // API takes ProjectCode, SubProjectMaster_Code, PartyMaster_Code
        const result = await GRNService.GetPOItemDetails(projectCode, subProjectCode, partyMaster_Code);
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
                const uomMc = String(item.UOMMaster_Code ?? item.uomMaster_Code ?? '');
                opt.dataset.uom  = item.UOM ?? item.uom ?? item.Uom ?? uomMc;
                opt.dataset.uomMasterCode = uomMc;
                opt.dataset.purchaseOrderTransactionCode = item.PurchaseOrderTransaction_Code ?? item.PurchaseOrderTransactionCode ?? item.Code ?? '';
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

// ── Item change → auto-fill rate, UOM + store PurchaseOrderTransaction_Code ────
function onItemChange(select) {
    const tr   = select.closest('tr');
    if (!tr) return;
    const opt  = select.options[select.selectedIndex];
    const rate = opt?.dataset?.rate ?? '';
    const uom  = opt?.dataset?.uom ?? '';
    const uomMasterCode = opt?.dataset?.uomMasterCode ?? '';
    const rateEl = tr.querySelector('.rate');
    if (rateEl) rateEl.value = rate ? parseFloat(rate).toFixed(2) : '';
    const uomCell = tr.querySelector('.uom-cell');
    if (uomCell) uomCell.value = uom || '';
    if (uomMasterCode) tr.dataset.uomMasterCode = String(uomMasterCode);
    // Store PurchaseOrderTransaction_Code from selected option (for save / update)
    const poTranCode = opt?.dataset?.purchaseOrderTransactionCode ?? '';
    if (poTranCode) {
        tr.dataset.purchaseOrderTransactionCode = String(poTranCode);
        const hf = tr.querySelector('.hf-purchase-order-transaction-code');
        if (hf) hf.value = String(poTranCode);
    }
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

    // ── Validate Accept Qty & Reject Qty cannot exceed Bill Qty ────────────────
    if (input.classList.contains('accept-qty') && acceptQty > billQty) {
        showToast(`Accept Qty cannot exceed Bill Qty (${billQty}).`, 'warning');
        input.value = '0';
        return onQtyChange(input);
    }
    if (input.classList.contains('reject-qty') && rejectQty > billQty) {
        showToast(`Reject Qty cannot exceed Bill Qty (${billQty}).`, 'warning');
        input.value = '0';
        return onQtyChange(input);
    }

    // ── Validate: Shortage = Bill Qty - (Accept Qty + Reject Qty); sum cannot exceed Bill ─
    if (acceptQty + rejectQty > billQty) {
        if (input.classList.contains('bill-qty')) {
            // User reduced Bill Qty; Accept+Reject now exceeds. Set Bill = Accept+Reject (minimum valid)
            const minBill = acceptQty + rejectQty;
            showToast(`Accept Qty + Reject Qty cannot be greater than Bill Qty. Bill Qty set to ${minBill}.`, 'warning');
            input.value = minBill;
            return onQtyChange(input);
        }
        if (input.classList.contains('accept-qty')) {
            showToast(`Accept Qty + Reject Qty cannot be greater than Bill Qty (${billQty}).`, 'warning');
            input.value = '0';
            return onQtyChange(input);
        }
        if (input.classList.contains('reject-qty')) {
            showToast(`Accept Qty + Reject Qty cannot be greater than Bill Qty (${billQty}).`, 'warning');
            input.value = '0';
            return onQtyChange(input);
        }
    }

    // ── Shortage = Bill Qty - (Accept Qty + Reject Qty) ─────────────────────────
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

    // Grid footer = sum of line amounts; Total Bill Amount = manual master field (TotalBillAmountManual).
    // Only auto-fill manual total on new entry when the field is still empty/zero.
    const elManual = document.getElementById('txtTotalBillAmountManual');
    if (elManual) {
        const manualVal = parseFloat(elManual.value) || 0;
        if (manualVal === 0 && total > 0) elManual.value = total.toFixed(2);
    }
    calcNetPayable();
}

function calcNetPayable() {
    const total   = parseFloat(document.getElementById('txtTotalBillAmountManual')?.value) || 0;
    const tds     = parseFloat(document.getElementById('txtTDSAmount')?.value) || 0;
    const deduct  = parseFloat(document.getElementById('txtDedution')?.value) || 0;
    const netEl   = document.getElementById('txtNetPayable');
    if (netEl) netEl.value = Math.max(0, total - tds - deduct).toFixed(2);
}

// ══════════════════════════════════════════════════════════════════════════════
// GRN LIST VIEW
// ══════════════════════════════════════════════════════════════════════════════

function formatGrnListInputDate(d) {
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}

function getGrnFinancialYearStartDate(today) {
    const fyYear = today.getMonth() < 3 ? today.getFullYear() - 1 : today.getFullYear();
    return new Date(fyYear, 3, 1);
}

function initGrnListFilters() {
    const today = new Date();
    const fromEl = document.getElementById('lstTxtFromDate');
    const toEl = document.getElementById('lstTxtToDate');
    const statusEl = document.getElementById('lstDdlStatus');
    if (toEl && !toEl.value) toEl.value = formatGrnListInputDate(today);
    if (fromEl && !fromEl.value) fromEl.value = formatGrnListInputDate(getGrnFinancialYearStartDate(today));
    if (statusEl && statusEl.value === '') statusEl.value = '0';
}

function getGrnListFilterValues() {
    return {
        FromDate: ($('#lstTxtFromDate').val() || '').trim(),
        ToDate: ($('#lstTxtToDate').val() || '').trim(),
        Status: ($('#lstDdlStatus').val() || '0').trim(),
    };
}

function validateGrnListFilters(filters) {
    if (!filters.FromDate || !filters.ToDate) {
        if (typeof toastr !== 'undefined') toastr.warning('Please select From Date and To Date.');
        return false;
    }
    if (new Date(filters.FromDate) > new Date(filters.ToDate)) {
        if (typeof toastr !== 'undefined') toastr.warning('From Date cannot be greater than To Date.');
        return false;
    }
    return true;
}

/** @param {number|string} [lastVerifiedGrnCode] Remember this code + merge (list API may omit Verified). */
function loadGRNList(lastVerifiedGrnCode) {
    initGrnListFilters();
    const filters = getGrnListFilterValues();
    if (!validateGrnListFilters(filters)) return Promise.resolve();

    var seq = ++grnListLoadSeq;
    return GRNService.GetGRNList(filters.Status, filters.FromDate, filters.ToDate).then(async function (response) {
        if (seq !== grnListLoadSeq) return;
        applyGrnMultilevelVerificationFromApiPayload(response);
        var rows = normalizeApiRows(response);
        rows.forEach(function (row) {
            if (rowIsVerifiedGrn(row)) {
                rememberGrnVerifiedCode(row.Code ?? row.code);
            }
        });
        if (lastVerifiedGrnCode !== undefined && lastVerifiedGrnCode !== null && lastVerifiedGrnCode !== "") {
            rememberGrnVerifiedCode(lastVerifiedGrnCode);
        }
        grnMasterSourceRows = applyRememberedVerifiedToRows(rows);
        window.grnMasterSourceRows = grnMasterSourceRows;
        await grnSyncListAttachmentStates(grnMasterSourceRows);
        if (seq !== grnListLoadSeq) return;
        updateGrnListStatChips();
        refreshGrnPendingOnMeBadgeFromApprovalApi(filters.FromDate, filters.ToDate);
        if (grnMasterSourceRows.length === 0) {
            if (typeof toastr !== 'undefined') toastr.warning('No GRN records found.');
            $("#grnListTable").hide();
            clearGRNListGridEmptyMessage();
        } else {
            $("#grnListTable").show();
            refreshGRNListGrid();
        }
    }).catch(function () {
        grnMasterSourceRows = [];
        window.grnMasterSourceRows = grnMasterSourceRows;
        updateGrnListStatChips();
        if (typeof toastr !== 'undefined') toastr.error('Failed to load GRN list.');
        $("#grnListTable").hide();
        clearGRNListGridEmptyMessage();
    });
}

function VerifyGRN(code) {
    if (!grnHasVerifyRight) {
        toastr.warning("You do not have Verify permission.");
        return;
    }
    if (!grnGridVerifyButtonAllowedByMultilevel()) {
        toastr.warning("Verify button is disabled for this setup (multilevelverification is N).");
        return;
    }
    grnVerifyPendingCode = code;
    $("#grnVerifyConfirmTitle").text("Verify this GRN?");
    $("#grnVerifyConfirmText").text("This will mark the GRN as verified.");
    $("#grnVerifyConfirmBackdrop").addClass("show");
}

function CloseGRNVerifyModal() {
    grnVerifyPendingCode = 0;
    $("#grnVerifyConfirmBackdrop").removeClass("show");
}

/** API success flag (Y / y / true). */
function isGrnVerifyApiSuccess(res) {
    if (!res) return false;
    var s = res.Status !== undefined ? res.Status : res.status;
    if (s === true || s === 1) return true;
    if (s === undefined || s === null) return false;
    return String(s).trim().toUpperCase() === "Y";
}

/** Server says already verified — still refresh list so check button becomes Verify badge. */
function isGrnAlreadyVerifiedApiMessage(res) {
    var msg = (res && (res.Msg || res.message || res.msg)) || "";
    msg = String(msg).toLowerCase();
    if (!msg) return false;
    return (
        msg.indexOf("already verified") >= 0 ||
        msg.indexOf("already verify") >= 0 ||
        msg.indexOf("mrn already") >= 0 ||
        msg.indexOf("grn already") >= 0 ||
        msg.indexOf("already been verified") >= 0
    );
}

function DoGRNVerify() {
    var code = grnVerifyPendingCode;
    if (!code) {
        CloseGRNVerifyModal();
        return;
    }
    var ModuleName = "GRN Services",
        OptionName = "Verify",
        ShowMsg = "Y",
        FinYear = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight === "N") {
            toastr.error(response.Msg);
            CloseGRNVerifyModal();
            return;
        }
        GRNService.VerifyGRNService(code)
            .then(function (res) {
                var ok = isGrnVerifyApiSuccess(res);
                var already = isGrnAlreadyVerifiedApiMessage(res);
                if (ok) {
                    CloseGRNVerifyModal();
                    toastr.success(res.Msg || "Verified successfully.");
                    loadGRNList(code);
                } else if (already) {
                    CloseGRNVerifyModal();
                    if (typeof toastr !== "undefined") {
                        toastr.info(res.Msg || "Already verified.");
                    }
                    loadGRNList(code);
                } else {
                    toastr.error((res && (res.Msg || res.message)) || "Verify failed.");
                }
            })
            .catch(function () {
                toastr.error("Verify failed. Please try again.");
            });
    }).catch(function (err) {
        console.error("DoGRNVerify permission check error:", err);
        toastr.error("Permission check failed.");
        CloseGRNVerifyModal();
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

function grnLocalYmdFromDate(d) {
    if (!d || Number.isNaN(d.getTime())) return '';
    return d.getFullYear() + '-'
        + String(d.getMonth() + 1).padStart(2, '0') + '-'
        + String(d.getDate()).padStart(2, '0');
}

function grnBillDateRawFromRow(item) {
    if (!item || typeof item !== 'object') return '';
    return item.BillDate ?? item.billDate ?? item['Bill Date']
        ?? item.ReceiveDate ?? item.receiveDate ?? '';
}

function grnFormatDateInput(val) {
    if (val === undefined || val === null || val === '') return '';
    const s = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const dmY = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmY) {
        return dmY[3] + '-' + dmY[2].padStart(2, '0') + '-' + dmY[1].padStart(2, '0');
    }
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return grnLocalYmdFromDate(d);
    return '';
}

function grnGetListRowRawByCode(codeNum) {
    const rows = grnMasterSourceRows || [];
    for (let i = 0; i < rows.length; i++) {
        const c = parseInt(rows[i].Code ?? rows[i].code ?? 0, 10);
        if (c === codeNum) return rows[i];
    }
    return grnGetApprovalSourceRow(codeNum) || null;
}

function grnGetListStatusCodeByCode(codeNum) {
    const n = parseInt(codeNum, 10);
    if (!Number.isFinite(n) || n <= 0) return "N";
    const raw = grnGetListRowRawByCode(n);
    if (raw) return computeGrnListStatusCode(raw);
    return n > 0 && grnMrnApprovedCodeSet.has(n) ? "P" : "N";
}

function grnIsApprovedGrnItem(item) {
    return grnIsVerifiedOrApprovedForEditBlock(item);
}

function grnIsApprovedGrn(codeNum) {
    return grnIsVerifiedOrApprovedForEditBlockByCode(codeNum);
}

/** yyyy-mm-dd for attachment control — same source as list "Bill Date" column. */
function grnResolveAttachmentEntryDate(codeOrRow, hint) {
    let raw = hint;
    if (raw === undefined || raw === null || String(raw).trim() === '') {
        if (codeOrRow && typeof codeOrRow === 'object') {
            raw = grnBillDateRawFromRow(codeOrRow);
        } else {
            const codeNum = parseInt(codeOrRow, 10);
            if (Number.isFinite(codeNum) && codeNum > 0) {
                const listRow = grnGetListRowRawByCode(codeNum);
                if (listRow) raw = grnBillDateRawFromRow(listRow);
            }
        }
    }
    return grnFormatDateInput(raw);
}

// ══════════════════════════════════════════════════════════════════════════════
// NEW GRN
// ══════════════════════════════════════════════════════════════════════════════
function newGRN() {
    resetForm();
    showFormView();
}

function grnApprovalEscHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function grnApprovalUnwrapRoot(res) {
    let root = res?.Data ?? res?.data ?? res?.Result ?? res?.result ?? res;
    if (root && typeof root === 'object' && !Array.isArray(root)) {
        const inner = root.Data ?? root.data ?? root.Result ?? root.result;
        if (inner && typeof inner === 'object') root = inner;
    }
    return root;
}

function grnApprovalIsLevelRow(row) {
    if (!row || typeof row !== 'object') return false;
    return row.LevelNo != null || row.Level != null || row.LevelOrder != null
        || row.ApprovalLevel_Code != null || row.MRNMasterLevel_Code != null
        || row.LevelDesc != null || row.LevelDesp != null || row.LevelName != null
        || row.ApproverName != null || row.UserName != null || row.ApprovedOn != null;
}

function grnApprovalParseLevelDetails(value) {
    if (Array.isArray(value)) return value;
    if (value == null) return [];
    if (typeof value === 'string') {
        const text = value.trim();
        if (!text) return [];
        try {
            const parsed = JSON.parse(text);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }
    return [];
}

function grnApprovalSourceRowCode(row) {
    if (!row || typeof row !== 'object') return 0;
    const n = parseInt(row.Code ?? row.code ?? row.MRNMaster_Code ?? row.mrnMaster_Code ?? 0, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
}

function grnRememberApprovalSourceRow(row) {
    const code = grnApprovalSourceRowCode(row);
    if (code > 0) grnApprovalSourceRowByCode[code] = row;
}

function grnGetApprovalSourceRow(code) {
    const n = parseInt(code, 10);
    return Number.isFinite(n) && n > 0 ? grnApprovalSourceRowByCode[n] : null;
}

function grnApprovalExtractNestedLevelRows(root) {
    if (!root || typeof root !== 'object') return [];
    const keys = [
        'LevelDetails', 'levelDetails',
        'MRNApprovallavels', 'mrnApprovallavels',
        'MRNApprovalLevels', 'mrnApprovalLevels',
        'MRNMasterLevelsApproval', 'mrnMasterLevelsApproval',
        'MRNMasterLevelDetails', 'mrnMasterLevelDetails',
        'ApprovalLevels', 'approvalLevels',
        'Table', 'table',
    ];
    for (let i = 0; i < keys.length; i++) {
        const arr = grnApprovalParseLevelDetails(root[keys[i]]);
        if (arr.length) return arr.filter(grnApprovalIsLevelRow);
    }
    return [];
}

function grnApprovalExtractLevelRows(res) {
    const root = grnApprovalUnwrapRoot(res);
    if (Array.isArray(root)) {
        const directRows = root.filter(grnApprovalIsLevelRow);
        if (directRows.length) return directRows;
        for (let i = 0; i < root.length; i++) {
            const nestedRows = grnApprovalExtractNestedLevelRows(root[i]);
            if (nestedRows.length) return nestedRows;
        }
        return [];
    }
    if (!root || typeof root !== 'object') return [];

    const nestedRows = grnApprovalExtractNestedLevelRows(root);
    if (nestedRows.length) return nestedRows;

    const objKeys = Object.keys(root);
    for (let i = 0; i < objKeys.length; i++) {
        const arr = root[objKeys[i]];
        if (Array.isArray(arr) && arr.length && grnApprovalIsLevelRow(arr[0])) {
            return arr.filter(grnApprovalIsLevelRow);
        }
    }
    return grnApprovalIsLevelRow(root) ? [root] : [];
}

function grnApprovalLevelNo(row, index) {
    const n = parseInt(row.LevelNo ?? row.Level ?? row.LevelOrder ?? row.ApprovalLevelNo ?? row.SequenceNo ?? 0, 10);
    return Number.isFinite(n) && n > 0 ? n : index + 1;
}

function grnApprovalLevelTitle(row, levelNo) {
    const title = grnApprovalExplicitLevelTitle(row);
    const text = title != null ? String(title).trim() : '';
    return text || ('Level ' + levelNo);
}

function grnApprovalExplicitLevelTitle(row) {
    if (!row || typeof row !== 'object') return '';
    return row.Description ?? row.description ?? row.LevelDesc ?? row.levelDesc ?? row.LevelDesp
        ?? row.levelDesp ?? row.LevelName ?? row.levelName ?? row.ApprovalLevelDesp
        ?? row.approvalLevelDesp ?? row.ApprovalLevelName ?? row.approvalLevelName ?? '';
}

function grnApprovalLevelRemarks(row) {
    const remarks = row.Remarks ?? row.Remark ?? row.ApprovalRemarks ?? row.LevelRemarks
        ?? row.Comments ?? row.RejectionRemarks;
    return remarks != null ? String(remarks).trim() : '';
}

function grnApprovalLevelApproved(row) {
    const approvedOn = row.ApprovedOn ?? row.ApprovedON ?? row.Approved_Date ?? row.ApprovedDate ?? row.ApprovedOnDate;
    if (approvedOn != null && String(approvedOn).trim() !== '') return true;
    const status = String(row.Status ?? row.ApprovalStatus ?? row.IsApproved ?? '').trim().toLowerCase();
    return status === 'y' || status === 'p' || status === 'approved' || status === '1' || status === 'true';
}

function grnApprovalLevelRejected(row) {
    const status = String(row.Status ?? row.ApprovalStatus ?? '').trim().toLowerCase();
    return status === 'r' || status === 'n' || status === 'rejected';
}

function grnApprovalFmtDate(value) {
    if (value == null || String(value).trim() === '') return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function grnApprovalNormalizeRows(res) {
    return grnApprovalExtractLevelRows(res).map(function (row, index) {
        const levelNo = grnApprovalLevelNo(row, index);
        return Object.assign({}, row, {
            LevelNo: levelNo,
            LevelOrder: levelNo,
        });
    }).sort(function (a, b) {
        return grnApprovalLevelNo(a, 0) - grnApprovalLevelNo(b, 0);
    });
}

function grnApprovalMergeRowsWithLabelFallback(apiRows, fallbackRows) {
    const map = new Map();
    (fallbackRows || []).forEach(function (row, index) {
        const levelNo = grnApprovalLevelNo(row, index);
        if (levelNo > 0) map.set(levelNo, Object.assign({}, row));
    });

    (apiRows || []).forEach(function (row, index) {
        const levelNo = grnApprovalLevelNo(row, index);
        if (levelNo < 1) return;
        const fallback = map.get(levelNo) || {};
        const merged = Object.assign({}, fallback, row);
        if (!String(grnApprovalExplicitLevelTitle(row)).trim()) {
            const fallbackTitle = grnApprovalExplicitLevelTitle(fallback);
            if (String(fallbackTitle).trim()) merged.LevelDesc = fallbackTitle;
        }
        map.set(levelNo, merged);
    });

    return Array.from(map.keys()).sort(function (a, b) { return a - b; }).map(function (levelNo) {
        return map.get(levelNo);
    });
}

function grnApprovalCurrentLevelInfoText(sourceRow, rows) {
    const source = sourceRow && typeof sourceRow === 'object' ? sourceRow : {};
    const total = parseInt(source.TotalLevels ?? source.totalLevels ?? source.MaxLevel ?? source.maxLevel ?? (rows || []).length, 10) || (rows || []).length || 1;
    const cur = parseInt(source.CurrentLevelNo ?? source.currentLevelNo ?? source.CurrentLevel ?? source.currentLevel ?? 1, 10) || 1;
    const masterDesc = String(source.CurrentLevelDesc ?? source.currentLevelDesc ?? '').trim();
    const currentRow = (rows || []).find(function (row, index) {
        return grnApprovalLevelNo(row, index) === cur;
    }) || {};
    const label = masterDesc || String(grnApprovalExplicitLevelTitle(currentRow)).trim() || ('Level ' + cur);
    return label + ' of ' + total;
}

function grnApprovalBindCurrentLevelInfo(sourceRow, rows) {
    if (!sourceRow || typeof sourceRow !== 'object') return;
    const text = grnApprovalCurrentLevelInfoText(sourceRow, rows);
    $('#gpaModalHeader .gpa-info-item').each(function () {
        const $item = $(this);
        const label = String($item.find('.gpa-info-lbl').text() || '').trim();
        if (label.indexOf('Current Level') !== -1) {
            $item.find('.gpa-info-val').text(text);
        }
    });
}

function grnApprovalBuildStepperHtml(rows) {
    if (!rows.length) {
        return '<div class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">Approval levels not found.</div>';
    }

    const firstPending = rows.find(function (row) {
        return !grnApprovalLevelApproved(row) && !grnApprovalLevelRejected(row);
    });
    const pendingNo = firstPending ? grnApprovalLevelNo(firstPending, 0) : 0;
    let html = '<div class="gpa-detail-stepper">';

    rows.forEach(function (row, index) {
        const levelNo = grnApprovalLevelNo(row, index);
        const approved = grnApprovalLevelApproved(row);
        const rejected = grnApprovalLevelRejected(row);
        const active = !approved && !rejected && pendingNo === levelNo;
        const stepState = rejected ? 'rejected' : approved ? 'done' : active ? 'active' : 'pending';
        const iconHtml = stepState === 'done' ? '<i class="fa fa-check"></i>'
            : stepState === 'rejected' ? '<i class="fa fa-times"></i>'
                : stepState === 'active' ? '<i class="fa fa-hourglass-half"></i>'
                    : String(levelNo);
        const badgeLabel = stepState === 'done' ? 'Approved'
            : stepState === 'rejected' ? 'Rejected'
                : stepState === 'active' ? 'Pending'
                    : 'Waiting';
        const approver = row.ApproverName ?? row.UserName ?? row.UserDesp ?? row.UserMasterName ?? row.EmployeeName ?? '';
        const approvedOn = grnApprovalFmtDate(row.ApprovedOn ?? row.ApprovedON ?? row.Approved_Date ?? row.ApprovedDate ?? '');
        const approverHtml = String(approver).trim() !== ''
            ? '<div class="gpa-dstep-sub"><i class="fa fa-user me-1"></i>' + grnApprovalEscHtml(approver)
                + (approvedOn ? ' - ' + grnApprovalEscHtml(approvedOn) : '') + '</div>'
            : '';
        const remarks = grnApprovalLevelRemarks(row);
        const remarksHtml = remarks
            ? '<div class="gpa-dstep-remarks"><i class="fa fa-comment me-1"></i>' + grnApprovalEscHtml(remarks) + '</div>'
            : '';
        const lineClass = stepState === 'done' ? 'gpa-dstep-line-done' : 'gpa-dstep-line-pending';

        html += '<div class="gpa-dstep-item gpa-dstep-' + stepState + '">' +
            '<div class="gpa-dstep-circle">' + iconHtml + '</div>' +
            '<div class="gpa-dstep-body">' +
            '<div class="gpa-dstep-title">' + grnApprovalEscHtml(grnApprovalLevelTitle(row, levelNo)) + '</div>' +
            approverHtml +
            remarksHtml +
            '<div class="gpa-dstep-badge gpa-dstep-badge-' + stepState + '">' + badgeLabel + '</div>' +
            '</div>' +
            '</div>';

        if (index < rows.length - 1) {
            html += '<div class="gpa-dstep-line ' + lineClass + '"></div>';
        }
    });

    html += '</div>';
    return html;
}

function renderGRNApprovalLevelsInModal(rows, sourceRow) {
    const html = grnApprovalBuildStepperHtml(rows || []);
    $('#gpaModalApprovalStepper').html(html);
    if (sourceRow) grnApprovalBindCurrentLevelInfo(sourceRow, rows || []);
    return html;
}

function bindMRNApprovalLevelsFromGRNService(code, sourceRow) {
    const $stepper = $('#gpaModalApprovalStepper');
    const approvalSourceRow = sourceRow || grnGetApprovalSourceRow(code);
    const fallbackRows = grnApprovalNormalizeRows(approvalSourceRow);

    if (fallbackRows.length) {
        renderGRNApprovalLevelsInModal(fallbackRows, approvalSourceRow);
    } else if ($stepper.length) {
        $stepper.html('<div class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;"><i class="fa fa-spinner fa-spin me-1"></i>Loading approval levels...</div>');
    }

    return GRNService.GetMRNApprovallavels(code)
        .then(function (res) {
            const apiRows = grnApprovalNormalizeRows(res);
            const rows = grnApprovalMergeRowsWithLabelFallback(apiRows, fallbackRows);
            const html = renderGRNApprovalLevelsInModal(rows, approvalSourceRow);
            setTimeout(function () {
                $('#gpaModalApprovalStepper').html(html);
                grnApprovalBindCurrentLevelInfo(approvalSourceRow, rows);
            }, 500);
            setTimeout(function () {
                $('#gpaModalApprovalStepper').html(html);
                grnApprovalBindCurrentLevelInfo(approvalSourceRow, rows);
            }, 1200);
            return rows;
        })
        .catch(function (err) {
            console.error('GetMRNApprovallavels', err);
            if (fallbackRows.length) {
                renderGRNApprovalLevelsInModal(fallbackRows, approvalSourceRow);
            } else if ($stepper.length) {
                $stepper.html('<div class="text-center py-3" style="color:#ef4444;font-size:0.82rem;"><i class="fa fa-exclamation-triangle me-1"></i>Error loading approval levels.</div>');
            }
            return fallbackRows;
        });
}

// ══════════════════════════════════════════════════════════════════════════════
// GRN SERVICE PRINT PREVIEW (GetCompany + GetGRNList)
// ══════════════════════════════════════════════════════════════════════════════

function grnPrintEscHtml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function grnPrintFmtDate(val) {
    if (!val) return '';
    const dt = new Date(val);
    if (isNaN(dt.getTime())) {
        const s = String(val).substring(0, 10);
        if (s.length >= 10) {
            const p = s.split('-');
            if (p.length === 3) return p[2] + '/' + p[1] + '/' + p[0];
        }
        return String(val);
    }
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function grnPrintFmtCurrency(num) {
    const n = parseFloat(num || 0);
    if (isNaN(n)) return '0.00';
    const parts = n.toFixed(2).split('.');
    const intPart = parts[0];
    const lastThree = intPart.slice(-3);
    const remaining = intPart.slice(0, -3);
    const formatted = remaining.length > 0
        ? remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
        : lastThree;
    return formatted + '.' + parts[1];
}

function grnPrintNumToWords(amount) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
        'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    function twoD(n) {
        if (n < 20) return ones[n];
        return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    }
    function threeD(n) {
        if (n >= 100) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + twoD(n % 100) : '');
        return twoD(n);
    }
    let n = Math.floor(Math.abs(amount));
    if (n === 0) return 'Zero Rupees Only';
    let w = '';
    if (n >= 10000000) { w += threeD(Math.floor(n / 10000000)) + ' Crore '; n %= 10000000; }
    if (n >= 100000) { w += twoD(Math.floor(n / 100000)) + ' Lakh '; n %= 100000; }
    if (n >= 1000) { w += twoD(Math.floor(n / 1000)) + ' Thousand '; n %= 1000; }
    if (n >= 100) { w += ones[Math.floor(n / 100)] + ' Hundred '; n %= 100; }
    if (n > 0) { w += twoD(n); }
    return w.trim() + ' Rupees Only';
}

function grnPrintAssetBaseUrl() {
    return (sessionStorage.getItem('AppBaseURL') || (window.location.origin + '/')).replace(/\/?$/, '/');
}

function grnPrintStampUrls() {
    const base = grnPrintAssetBaseUrl();
    return {
        verified: base + 'assets/images/PPPL_Stamp_Finance.jpeg',
        approved: base + 'assets/images/PPPL_Stamp_HODA.jpeg',
    };
}

function grnPrintStampImgHtml(src, alt) {
    return '<img class="grn-sig-stamp" src="' + String(src || '') + '" alt="' + grnPrintEscHtml(alt) + '">';
}

function grnCompanyFromGetCompanyApi(resp) {
    if (resp == null) {
        return { companyName: '', companyAddr: '', companyTag: '' };
    }
    let row = null;
    const rows = normalizeApiRows(resp);
    if (rows.length && rows[0]) row = rows[0];
    if (!row) {
        const o = resp.Data ?? resp.data ?? resp;
        if (o && typeof o === 'object' && !Array.isArray(o)) row = o;
    }
    row = row || {};
    const phone = String(row.OfficePhones1 ?? row.officePhones1 ?? '').trim();
    const web = String(row.WebSite ?? row.webSite ?? row.Website ?? row.website ?? '').trim();
    let tagFromApi = phone && web ? phone + ' · ' + web : (phone || web);
    const branchTag = String(row.BranchName ?? row.branchName ?? row.CompanyTagLine ?? row.TagLine ?? row.tagLine ?? '').trim();
    return {
        companyName: String(row.CompanyName ?? row.companyName ?? row.CompanyInfo ?? row.Name ?? row.name ?? '').trim(),
        companyAddr: String(
            row.OfficeAddress1 ?? row.officeAddress1
            ?? row.CompanyAddress ?? row.companyAddress ?? row.Address ?? row.address ?? ''
        ).trim(),
        companyTag: String(row.TagLine ?? row.tagLine ?? row.CompanyTagLine ?? '').trim()
            || ((tagFromApi && branchTag) ? (tagFromApi + ' · ' + branchTag) : (tagFromApi || branchTag)),
    };
}

function grnPrintSessionCompany() {
    let companyName = '', companyAddr = '', companyTag = '';
    try {
        const ud = JSON.parse(sessionStorage.getItem('UserDetails') || '[]');
        if (ud && ud[0]) {
            companyName = ud[0].CompanyName || ud[0].CompanyNameForShow || '';
            companyAddr = ud[0].CompanyAddress || '';
            companyTag = ud[0].BranchName || ud[0].CompanyTagLine || ud[0].TagLine || '';
        }
    } catch (e) { /* ignore */ }
    return { companyName, companyAddr, companyTag };
}

function grnMergePrintCompanyInfo(sessionCo, apiCo) {
    const s = sessionCo || {};
    const a = apiCo || {};
    return {
        companyName: a.companyName || s.companyName || '',
        companyAddr: a.companyAddr || s.companyAddr || '',
        companyTag: a.companyTag || s.companyTag || '',
    };
}

function grnPrintShowPpplLogo(companyName) {
    const n = String(companyName || '').trim().toUpperCase();
    return n.indexOf('PURSHOTAM') >= 0 || n.indexOf('SOLAR') >= 0 || n.indexOf('PPPL') >= 0;
}

function grnFindListRowForPrint(codeNum) {
    const rows = grnMasterSourceRows || [];
    for (let i = 0; i < rows.length; i++) {
        const c = parseInt(rows[i].Code ?? rows[i].code ?? 0, 10);
        if (c === codeNum) return rows[i];
    }
    return grnGetApprovalSourceRow(codeNum) || null;
}

function grnPrintStatusLabel(listRow) {
    const st = computeGrnListStatusCode(listRow || {});
    if (st === 'P') return 'Approved';
    if (st === 'R') return 'Rejected';
    if (rowIsVerifiedGrn(listRow)) return 'Verified';
    return 'Pending';
}

/** MRNMaster.Code on GET_GRNLIST rows (SP alias: Code). */
function grnPrintRowMasterCode(r) {
    if (!r || typeof r !== 'object') return 0;
    return parseInt(
        r.MRNMaster_Code ?? r.mRNMaster_Code ?? r.MRNMasterCode ?? r.Code ?? r.code ?? 0,
        10
    ) || 0;
}

function grnPrintRowLooksLikeDetail(r) {
    if (!r || typeof r !== 'object') return false;
    return r.ItemName != null || r.itemName != null
        || r.ProjectDesp != null || r.projectDesp != null
        || r.PONo != null || r.poNo != null
        || r.Amount != null || r.amount != null
        || r.UOM != null || r.uom != null
        || r.QtyBill != null || r.qtyBill != null
        || r.QtyMT != null || r.qtyMT != null
        || r.Rate != null || r.rate != null;
}

/** Unwrap GetGRNList / GET_GRNLIST API payload (Code, BillNo, ProjectDesp, ItemName, …). */
function normalizeGrnPrintListRows(result) {
    if (!result) return [];
    if (Array.isArray(result)) return result;

    const directKeys = [
        'GRNList', 'grnList', 'GRNServiceList', 'grnServiceList',
        'Data', 'data', 'Table', 'table', 'Result', 'result',
        'Items', 'items', 'List', 'list', 'Rows', 'rows',
    ];
    for (let i = 0; i < directKeys.length; i++) {
        const k = directKeys[i];
        if (Array.isArray(result[k]) && result[k].length) return result[k];
    }

    if (result.Data != null || result.data != null) {
        const datum = result.Data ?? result.data;
        if (Array.isArray(datum)) return datum;
        if (datum && typeof datum === 'object') {
            const inner = normalizeGrnPrintListRows(datum);
            if (inner.length) return inner;
        }
    }

    if (typeof result === 'object') {
        const vals = Object.values(result);
        for (let j = 0; j < vals.length; j++) {
            const v = vals[j];
            if (Array.isArray(v) && v.length && grnPrintRowLooksLikeDetail(v[0])) return v;
        }
        for (let k = 0; k < vals.length; k++) {
            const v = vals[k];
            if (v && typeof v === 'object' && !Array.isArray(v)) {
                const nested = normalizeGrnPrintListRows(v);
                if (nested.length) return nested;
            }
        }
    }

    return normalizeApiRows(result);
}

function grnFilterPrintDetailRows(allRows, codeNum, listRow) {
    if (!Array.isArray(allRows) || !allRows.length) return [];

    let filtered = allRows.filter(function (r) {
        return grnPrintRowMasterCode(r) === codeNum;
    });

    const billNo = listRow?.BillNo ?? listRow?.billNo ?? listRow?.['Bill No'];
    if (!filtered.length && billNo != null && billNo !== '') {
        filtered = allRows.filter(function (r) {
            return String(r.BillNo ?? r.billNo ?? '') === String(billNo);
        });
    }

    if (!filtered.length && listRow) {
        const proj = grnPickPrintField(listRow, ['ProjectDesp', 'projectDesp', 'Project', 'project']);
        const site = grnPickPrintField(listRow, ['SubProjectDesp', 'subProjectDesp', 'Sub Project', 'SiteName', 'siteName']);
        if (proj || site) {
            filtered = allRows.filter(function (r) {
                const rp = grnPickPrintField(r, ['ProjectDesp', 'projectDesp', 'ProjectName', 'projectName']);
                const rs = grnPickPrintField(r, ['SubProjectDesp', 'subProjectDesp', 'SiteName', 'siteName']);
                return (!proj || rp === proj) && (!site || rs === site);
            });
        }
    }

    return filtered;
}

function grnPrintProjectSiteKeys() {
    return {
        project: ['ProjectDesp', 'projectDesp', 'ProjectName', 'projectName', 'Project', 'project'],
        site: ['SubProjectDesp', 'subProjectDesp', 'SiteName', 'siteName', 'Sub Project', 'Site', 'site'],
    };
}

/** Ensure every print line has Project / Site — from row, else list row / master. */
function grnStampPrintDetailProjectSite(detailRows, listRow, masterRow) {
    const keys = grnPrintProjectSiteKeys();
    const projFallback = grnPickPrintField(listRow, keys.project)
        || grnPickPrintField(masterRow, keys.project);
    const siteFallback = grnPickPrintField(listRow, keys.site)
        || grnPickPrintField(masterRow, keys.site);
    if (!Array.isArray(detailRows)) return [];
    return detailRows.map(function (row) {
        const out = Object.assign({}, row);
        if (!grnPickPrintField(out, keys.project) && projFallback) {
            out.ProjectDesp = projFallback;
        }
        if (!grnPickPrintField(out, keys.site) && siteFallback) {
            out.SubProjectDesp = siteFallback;
        }
        return out;
    });
}

/** Fallback when GetGRNList is empty — map GetGRNServiceByCode detail to print rows. */
function grnPrintDetailsFromGetByCode(resp, codeNum, listRow) {
    if (!resp || typeof resp !== 'object') return { master: {}, rows: [] };
    const master = (resp.GRNServiceList ?? resp.grnServiceList)?.[0] ?? resp.Master ?? resp.master ?? {};
    const items = resp.GRNServiceDetail ?? resp.grnServiceDetail ?? resp.Detail ?? resp.detail ?? [];
    if (!Array.isArray(items)) return { master: master, rows: [] };
    const keys = grnPrintProjectSiteKeys();
    const projFallback = grnPickPrintField(listRow, keys.project)
        || grnPickPrintField(master, keys.project);
    const siteFallback = grnPickPrintField(listRow, keys.site)
        || grnPickPrintField(master, keys.site);
    const rows = items.map(function (item) {
        return Object.assign({}, item, {
            Code: codeNum,
            MRNMaster_Code: codeNum,
            ProjectDesp: grnPickPrintField(item, keys.project) || projFallback,
            SubProjectDesp: grnPickPrintField(item, keys.site) || siteFallback,
            BillNo: master.BillNo ?? master.billNo ?? item.BillNo ?? item.billNo,
            BillDate: master.BillDate ?? master.billDate ?? item.BillDate ?? item.billDate,
            ReceiveDate: master.ReceiveDate ?? master.receiveDate ?? item.ReceiveDate ?? item.receiveDate,
            SiteType: master.SiteType ?? master.siteType ?? item.SiteType ?? item.siteType ?? 'PPA',
            AccountDesp: master.AccountDesp ?? master.accountDesp ?? item.AccountDesp ?? item.accountDesp,
            PhoneNo: master.PhoneNo ?? master.phoneNo ?? item.PhoneNo ?? item.phoneNo,
            IndustryType: master.IndustryType ?? master.industryType ?? item.IndustryType ?? item.industryType,
            TransporterName: master.TransporterName ?? master.transporterName ?? '',
            Deduction: master.Deduction ?? master.deduction ?? master.Dedution ?? master.dedution,
            DeductionRemark: master.DeductionRemark ?? master.deductionRemark ?? master.DedutionRemark ?? master.dedutionRemark,
            NetPayable: master.NetPayable ?? master.netPayable,
            TotalBillAmountManual: master.TotalBillAmountManual ?? master.totalBillAmountManual,
            TDSAmount: master.TDSAmount ?? master.tdsAmount,
            Remark: master.Remarks ?? master.remarks ?? master.Remark ?? master.remark,
            PONo: item.PONo ?? item.poNo ?? item.PoNO ?? item.PurchaseOrderMaster_Code ?? item.purchaseOrderMaster_Code ?? '',
            PODate: item.PODate ?? item.poDate ?? '',
            ItemName: item.ItemName ?? item.itemName ?? '',
            UOM: item.UOM ?? item.uom ?? item.Uom ?? '',
            BillQty: item.QtyBill ?? item.qtyBill ?? item.BillQty ?? item.billQty,
            AcceptQty: item.GRNRejectedQty ?? item.grnRejectedQty ?? item.AcceptQty ?? item.acceptQty ?? item.QtyMT ?? item.qtyMT,
            RejectQty: item.RejectedQtyBill ?? item.rejectedQtyBill,
            ShortageQty: item.SortageQty ?? item.sortageQty ?? item.ShortageQty ?? item.shortageQty,
            Rate: item.Rate ?? item.rate ?? 0,
            Amount: item.Amount ?? item.amount ?? 0,
            Remarks: item.Remarks ?? item.remarks ?? item.LineRemarks ?? item.lineRemarks ?? '',
        });
    });
    return { master: master, rows: rows.map(grnNormalizePrintDetailRow) };
}

function grnMergeListRowForPrint(listRow, masterFromApi) {
    const out = Object.assign({}, listRow || {}, masterFromApi || {});
    const keys = grnPrintProjectSiteKeys();
    if (!grnPickPrintField(out, keys.project)) {
        const p = grnPickPrintField(masterFromApi, keys.project);
        if (p) out.ProjectDesp = p;
    }
    if (!grnPickPrintField(out, keys.site)) {
        const s = grnPickPrintField(masterFromApi, keys.site);
        if (s) out.SubProjectDesp = s;
    }
    if (!grnPickPrintField(out, ['MRNNo', 'mRNNo', 'GRNo', 'MRN No'])) {
        const mrn = masterFromApi?.MRNNo ?? masterFromApi?.mRNNo;
        if (mrn != null && mrn !== '') out.MRNNo = mrn;
    }
    if (!grnPickPrintField(out, ['AccountDesp', 'PartyName', 'Party Name'])) {
        const party = masterFromApi?.AccountDesp ?? masterFromApi?.accountDesp;
        if (party) out.AccountDesp = party;
    }
    if (!grnPickPrintField(out, ['TransporterName', 'transporterName'])) {
        const tr = masterFromApi?.TransporterName ?? masterFromApi?.transporterName;
        if (tr) out.TransporterName = tr;
    }
    if (!grnPickPrintField(out, ['NetPayable', 'netPayable'])) {
        const net = masterFromApi?.NetPayable ?? masterFromApi?.netPayable;
        const bill = parseFloat(masterFromApi?.TotalBillAmountManual ?? masterFromApi?.totalBillAmountManual ?? out.TotalBillAmountManual ?? out.totalBillAmountManual ?? 0) || 0;
        const ded = parseFloat(masterFromApi?.Dedution ?? masterFromApi?.dedution ?? masterFromApi?.Deduction ?? masterFromApi?.deduction ?? 0) || 0;
        const tds = parseFloat(masterFromApi?.TDSAmount ?? masterFromApi?.tdsAmount ?? 0) || 0;
        if (bill > 0) {
            out.NetPayable = Math.max(0, bill - tds - ded);
        } else if (net != null && net !== '') {
            out.NetPayable = net;
        }
    } else {
        const bill = grnPrintDetailNum(out, ['TotalBillAmountManual', 'totalBillAmountManual']);
        if (bill > 0) {
            const ded = grnPrintDetailNum(out, ['Deduction', 'deduction', 'Dedution', 'dedution']);
            const tds = grnPrintDetailNum(out, ['TDSAmount', 'tdsAmount']);
            out.NetPayable = Math.max(0, bill - tds - ded);
        }
    }
    if (out.TotalBillAmountManual == null || out.TotalBillAmountManual === '') {
        const bill = masterFromApi?.TotalBillAmountManual ?? masterFromApi?.totalBillAmountManual;
        if (bill != null && bill !== '') out.TotalBillAmountManual = bill;
    }
    if (!grnPrintDetailNum(out, ['Deduction', 'deduction', 'Dedution', 'dedution'])) {
        const ded = masterFromApi?.Dedution ?? masterFromApi?.dedution ?? masterFromApi?.Deduction ?? masterFromApi?.deduction;
        if (ded != null && ded !== '') {
            out.Dedution = ded;
            out.Deduction = ded;
        }
    }
    if (!grnPrintDetailNum(out, ['TDSAmount', 'tdsAmount'])) {
        const tds = masterFromApi?.TDSAmount ?? masterFromApi?.tdsAmount;
        if (tds != null && tds !== '') out.TDSAmount = tds;
    }
    return out;
}

function grnPickPrintField(row, keys) {
    if (!row || typeof row !== 'object') return '';
    for (let i = 0; i < keys.length; i++) {
        const v = row[keys[i]];
        if (v !== undefined && v !== null && String(v).trim() !== '' && String(v).trim().toLowerCase() !== 'null') {
            return String(v).trim();
        }
    }
    return '';
}

function grnPrintMrnNo(listRow, codeNum) {
    const mrn = grnPickPrintField(listRow, ['MRNNo', 'mRNNo', 'GRNo', 'grnNo', 'MRN No', 'GRN No']);
    if (mrn) return mrn;
    const codeAsMrn = parseInt(codeNum, 10);
    return codeAsMrn > 0 ? String(codeAsMrn) : '';
}

function grnEnrichListRowFromPrintDetails(listRow, detailRows) {
    const out = Object.assign({}, listRow || {});
    const first = (detailRows && detailRows[0]) ? detailRows[0] : null;
    const pickDetailNum = function (keys) {
        let best = 0;
        (detailRows || []).forEach(function (row) {
            const n = grnPrintDetailNum(row, keys);
            if (n > best) best = n;
        });
        return best;
    };
    const fillIfEmpty = function (key, val) {
        if (val === undefined || val === null || String(val).trim() === '' || String(val).trim().toLowerCase() === 'null') return;
        if (!grnPickPrintField(out, [key])) out[key] = val;
    };
    if (!first) return out;
    fillIfEmpty('ProjectDesp', first.ProjectDesp ?? first.projectDesp);
    fillIfEmpty('SubProjectDesp', first.SubProjectDesp ?? first.subProjectDesp);
    fillIfEmpty('SiteType', first.SiteType ?? first.siteType);
    fillIfEmpty('IndustryType', first.IndustryType ?? first.industryType);
    fillIfEmpty('PhoneNo', first.PhoneNo ?? first.phoneNo);
    fillIfEmpty('BillNo', first.BillNo ?? first.billNo);
    fillIfEmpty('BillDate', first.BillDate ?? first.billDate);
    fillIfEmpty('ReceiveDate', first.ReceiveDate ?? first.receiveDate);
    fillIfEmpty('AccountDesp', first.AccountDesp ?? first.accountDesp ?? first.PartyName ?? first.partyName);
    fillIfEmpty('MRNNo', first.MRNNo ?? first.mRNNo ?? first.GRNo);
    fillIfEmpty('TransporterName', first.TransporterName ?? first.transporterName);
    fillIfEmpty('Deduction', first.Deduction ?? first.deduction ?? first.Dedution ?? first.dedution);
    fillIfEmpty('DeductionRemark', first.DeductionRemark ?? first.deductionRemark ?? first.DedutionRemark ?? first.dedutionRemark);
    const manualBill = pickDetailNum(['TotalBillAmountManual', 'totalBillAmountManual']);
    if (manualBill > 0) fillIfEmpty('TotalBillAmountManual', manualBill);
    const tdsAmt = pickDetailNum(['TDSAmount', 'tdsAmount']);
    if (tdsAmt > 0) fillIfEmpty('TDSAmount', tdsAmt);
    const dedAmt = pickDetailNum(['Deduction', 'deduction', 'Dedution', 'dedution']);
    if (dedAmt > 0) {
        fillIfEmpty('Deduction', dedAmt);
        fillIfEmpty('Dedution', dedAmt);
    }
    return out;
}

/** Map API / form row to GRN ITEM DETAILS grid columns (same as itemTbody). */
function grnNormalizePrintDetailRow(row) {
    if (!row || typeof row !== 'object') return {};
    const billQty = grnPrintDetailNum(row, ['QtyBill', 'qtyBill', 'BillQty', 'billQty']);
    const acceptQty = grnPrintDetailNum(row, ['GRNRejectedQty', 'grnRejectedQty', 'AcceptQty', 'acceptQty', 'QtyMT', 'qtyMT']);
    const rejectQty = grnPrintDetailNum(row, ['RejectedQtyBill', 'rejectedQtyBill']);
    let shortage = grnPrintDetailNum(row, ['SortageQty', 'sortageQty', 'ShortageQty', 'shortageQty', 'Shortage', 'shortage']);
    if (!shortage && (billQty || acceptQty || rejectQty)) {
        shortage = Math.max(0, billQty - acceptQty - rejectQty);
    }
    const rate = grnPrintDetailNum(row, ['Rate', 'rate']);
    let amt = grnPrintDetailNum(row, ['Amount', 'amount']);
    if (!amt && rate && acceptQty) {
        amt = rate * acceptQty;
    } else if (!amt && rate && billQty) {
        amt = rate * billQty;
    }
    return Object.assign({}, row, {
        BillQty: billQty,
        AcceptQty: acceptQty,
        RejectQty: rejectQty,
        ShortageQty: shortage,
        Rate: rate,
        Amount: amt,
        ItemName: grnPickPrintField(row, ['ItemName', 'itemName', 'Item', 'item']),
        UOM: grnPickPrintField(row, ['UOM', 'uom', 'Uom']),
        PONo: grnPickPrintField(row, ['PONo', 'poNo', 'PoNO']),
        PODate: row.PODate ?? row.poDate,
        Remarks: grnPickPrintField(row, ['Remarks', 'remarks', 'LineRemarks', 'lineRemarks', 'Remark', 'remark']),
    });
}

function grnNormalizePrintDetailRows(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.map(grnNormalizePrintDetailRow);
}

function grnPrintOpenFormCode() {
    const hdn = parseInt(document.getElementById('hdnMRNMasterCode')?.value || '0', 10);
    const edit = parseInt(typeof editCode !== 'undefined' ? editCode : 0, 10);
    return hdn > 0 ? hdn : (edit > 0 ? edit : 0);
}

function grnIsFormViewVisible() {
    const formEl = document.getElementById('divGRNForm');
    if (!formEl) return !!document.getElementById('itemTbody');
    const style = window.getComputedStyle(formEl);
    return style.display !== 'none' && style.visibility !== 'hidden';
}

/** Read GRN ITEM DETAILS grid when printing the record open in the form. */
function grnPrintDetailsFromFormGrid(codeNum) {
    if (grnPrintOpenFormCode() !== codeNum) return null;
    if (!grnIsFormViewVisible()) return null;
    const tbody = document.getElementById('itemTbody');
    if (!tbody || !tbody.rows.length) return null;

    const rows = [];
    Array.from(tbody.rows).forEach(function (tr) {
        const poSel = tr.querySelector('.po-select');
        const itemSel = tr.querySelector('.item-select');
        const poOpt = poSel?.selectedOptions?.[0];
        const itemOpt = itemSel?.selectedOptions?.[0];
        const billQty = parseFloat(tr.querySelector('.bill-qty')?.value) || 0;
        const acceptQty = parseFloat(tr.querySelector('.accept-qty')?.value) || 0;
        const rejectQty = parseFloat(tr.querySelector('.reject-qty')?.value) || 0;
        let shortage = parseFloat(tr.querySelector('.shortage-qty')?.value);
        if (isNaN(shortage)) shortage = Math.max(0, billQty - acceptQty - rejectQty);

        rows.push(grnNormalizePrintDetailRow({
            PONo: (poOpt?.text || poSel?.value || '').trim(),
            ItemName: (itemOpt?.text || itemSel?.value || '').trim(),
            UOM: tr.querySelector('.uom-cell')?.value || itemOpt?.dataset?.uom || '',
            QtyBill: billQty,
            GRNRejectedQty: acceptQty,
            RejectedQtyBill: rejectQty,
            SortageQty: shortage,
            Rate: parseFloat(tr.querySelector('.rate')?.value) || 0,
            Amount: parseFloat(tr.querySelector('.amount')?.value) || 0,
            Remarks: tr.querySelector('.row-remark')?.value || '',
        }));
    });
    return rows.length ? rows : null;
}

function grnPrintListRowFromForm(codeNum) {
    if (grnPrintOpenFormCode() !== codeNum || !grnIsFormViewVisible()) return null;
    const ddlParty = document.getElementById('ddlPartyName');
    const partyOpt = ddlParty?.selectedOptions?.[0];
    const totalBill = parseFloat(document.getElementById('txtTotalBillAmountManual')?.value) || 0;
    const tds = parseFloat(document.getElementById('txtTDSAmount')?.value) || 0;
    const deduct = parseFloat(document.getElementById('txtDedution')?.value) || 0;
    const netPayable = totalBill > 0
        ? Math.max(0, totalBill - tds - deduct)
        : (parseFloat(document.getElementById('txtNetPayable')?.value) || 0);
    return {
        BillNo: document.getElementById('txtBillNo')?.value || '',
        BillDate: document.getElementById('dtBillDate')?.value || '',
        ReceiveDate: document.getElementById('dtRecvDate')?.value || '',
        MRNNo: document.getElementById('txtGRNNo')?.value || '',
        AccountDesp: partyOpt?.text || '',
        Remarks: document.getElementById('txtRemark')?.value || '',
        TotalBillAmountManual: totalBill,
        Dedution: deduct,
        Deduction: deduct,
        DedutionRemark: document.getElementById('txtDedutionRemark')?.value || '',
        TDSAmount: tds,
        NetPayable: netPayable,
    };
}

function grnPrintFmtGridQty(num) {
    const n = parseFloat(num);
    if (isNaN(n)) return '';
    if (Math.abs(n - Math.round(n)) < 0.0001) return String(Math.round(n));
    return n.toFixed(3);
}

function grnPrintFmtGridRate(num) {
    const n = parseFloat(num);
    if (isNaN(n)) return '';
    return n.toFixed(2);
}

function grnPrintFmtQty(num) {
    const n = parseFloat(num);
    if (isNaN(n)) return '';
    return n.toFixed(3);
}

function grnPrintFmtRate(num) {
    const n = parseFloat(num);
    if (isNaN(n)) return '';
    return n.toFixed(3);
}

function grnPrintFmtDiscount(num) {
    const n = parseFloat(num);
    if (isNaN(n) || n === 0) return '0.00000';
    return n.toFixed(5);
}

function grnPrintDetailNum(row, keys) {
    for (let i = 0; i < keys.length; i++) {
        const v = row[keys[i]];
        if (v !== undefined && v !== null && v !== '' && String(v).trim().toLowerCase() !== 'null') {
            const n = parseFloat(String(v).replace(/,/g, ''));
            if (!isNaN(n)) return n;
        }
    }
    return 0;
}

function grnPrintBuildSupplierAddressHtml(listRow) {
    let partyName = grnPickPrintField(listRow, ['AccountDesp', 'accountDesp', 'PartyName', 'partyName', 'Party Name', 'VendorName', 'vendorName']);
    if (!partyName) {
        partyName = grnPickPrintField(listRow, ['IndustryType', 'industryType']);
    }
    const addr = grnPickPrintField(listRow, ['AccountAddress', 'accountAddress', 'PartyAddress', 'partyAddress', 'Address', 'address']);
    const projectHdr = grnPickPrintField(listRow, grnPrintProjectSiteKeys().project);
    const siteHdr = grnPickPrintField(listRow, grnPrintProjectSiteKeys().site);
    const phoneNo = grnPickPrintField(listRow, ['PhoneNo', 'phoneNo', 'ContactNo', 'contactNo']);
    const lines = [];
    if (partyName) lines.push('<div class="grn-sup-name">' + grnPrintEscHtml(partyName) + '</div>');
    if (addr) {
        String(addr).split(/\r?\n/).forEach(function (ln) {
            const t = String(ln || '').trim();
            if (t) lines.push('<div>' + grnPrintEscHtml(t) + '</div>');
        });
    }
    if (projectHdr) lines.push('<div>' + grnPrintEscHtml(projectHdr) + '</div>');
    if (siteHdr) lines.push('<div>' + grnPrintEscHtml(siteHdr) + '</div>');
    if (phoneNo) lines.push('<div>Ph : ' + grnPrintEscHtml(phoneNo) + '</div>');
    if (!lines.length) lines.push('<div>&nbsp;</div>');
    return lines.join('');
}

function grnPrintBuildMetaRowHtml(label, value) {
    return '<tr><td class="grn-meta-lbl">' + grnPrintEscHtml(label) + '</td>'
        + '<td class="grn-meta-val">' + grnPrintEscHtml(value || '') + '</td></tr>';
}

function grnPrintGroupDetailRowsByPo(detailRows) {
    const groups = [];
    const map = {};
    (detailRows || []).forEach(function (row) {
        const poNo = grnPickPrintField(row, ['PONo', 'poNo', 'PoNO']) || '—';
        if (!map[poNo]) {
            map[poNo] = {
                poNo: poNo,
                poDate: grnPrintFmtDate(row.PODate ?? row.poDate),
                rows: [],
            };
            groups.push(map[poNo]);
        }
        map[poNo].rows.push(row);
    });
    return groups;
}

/** Item table — same columns as GRN ITEM DETAILS grid on form. */
function grnPrintBuildItemTableRowsHtml(detailRows) {
    const COL_COUNT = 10;
    const MIN_ROWS = 14;
    let sno = 0;
    let totalAmt = 0;
    let html = '';
    const normalized = grnNormalizePrintDetailRows(detailRows);
    const groups = grnPrintGroupDetailRowsByPo(normalized);

    groups.forEach(function (grp) {
        let poHdr = 'Pur. Order No. ' + grnPrintEscHtml(grp.poNo);
        if (grp.poDate) poHdr += ' &nbsp;&nbsp; PO Date : ' + grnPrintEscHtml(grp.poDate);
        html += '<tr class="grn-po-row"><td colspan="' + COL_COUNT + '">' + poHdr + '</td></tr>';
        grp.rows.forEach(function (row) {
            sno += 1;
            const item = row.ItemName || grnPickPrintField(row, ['ItemName', 'itemName']);
            const uom = row.UOM || grnPickPrintField(row, ['UOM', 'uom']);
            const billQty = row.BillQty ?? 0;
            const acceptQty = row.AcceptQty ?? 0;
            const rejectQty = row.RejectQty ?? 0;
            const shortage = row.ShortageQty ?? 0;
            const rate = row.Rate ?? 0;
            const amt = row.Amount ?? 0;
            const lineRemarks = row.Remarks || '';
            totalAmt += amt;
            html += '<tr>'
                + '<td class="grn-tc">' + sno + '</td>'
                + '<td class="grn-tl">' + grnPrintEscHtml(item) + '</td>'
                + '<td class="grn-tc">' + grnPrintEscHtml(uom) + '</td>'
                + '<td class="grn-tr">' + grnPrintFmtGridQty(billQty) + '</td>'
                + '<td class="grn-tr">' + grnPrintFmtGridQty(acceptQty) + '</td>'
                + '<td class="grn-tr">' + grnPrintFmtGridQty(rejectQty) + '</td>'
                + '<td class="grn-tr">' + grnPrintFmtGridQty(shortage) + '</td>'
                + '<td class="grn-tr">' + grnPrintFmtGridRate(rate) + '</td>'
                + '<td class="grn-tr">' + (amt ? grnPrintFmtCurrency(amt) : '') + '</td>'
                + '<td class="grn-tl">' + grnPrintEscHtml(lineRemarks) + '</td>'
                + '</tr>';
        });
    });

    if (!html) {
        html = '<tr><td colspan="' + COL_COUNT + '" class="grn-tc" style="padding:10px;color:#666;">No line items found.</td></tr>';
    }

    const usedRows = sno + groups.length;
    for (let i = usedRows; i < MIN_ROWS; i++) {
        html += '<tr class="grn-empty-row">';
        for (let c = 0; c < COL_COUNT; c++) html += '<td>&nbsp;</td>';
        html += '</tr>';
    }

    return { html: html, totalAmt: totalAmt, lineCount: sno, colCount: COL_COUNT };
}

function grnResolvePrintTotals(listRow, lineTotal) {
    const deduction = grnPrintDetailNum(listRow, ['Deduction', 'deduction', 'Dedution', 'dedution']);
    const tdsAmount = grnPrintDetailNum(listRow, ['TDSAmount', 'tdsAmount']);
    const manualTotal = grnPrintDetailNum(listRow, ['TotalBillAmountManual', 'totalBillAmountManual']);
    const totalBillAmt = manualTotal || lineTotal || 0;

    // Net Payable must follow Total Bill Amount (manual), not line sum or stale stored NetPayable.
    let netPayable = 0;
    if (totalBillAmt > 0) {
        netPayable = Math.max(0, totalBillAmt - tdsAmount - deduction);
    } else {
        netPayable = grnPrintDetailNum(listRow, ['NetPayable', 'netPayable']);
        if (!netPayable && lineTotal) {
            netPayable = Math.max(0, lineTotal - tdsAmount - deduction);
        }
    }

    return {
        lineTotalAmt: lineTotal || 0,
        totalBillAmt: totalBillAmt,
        deduction: deduction,
        tdsAmount: tdsAmount,
        netPayable: netPayable,
    };
}

function grnPrintBuildSummaryFooterHtml(colCount, totals, masterRemark) {
    const totalBillAmt = totals.totalBillAmt || 0;
    const wordsLine = '<strong>Total Amount Rs:</strong> '
        + grnPrintEscHtml(grnPrintFmtCurrency(Math.round(totalBillAmt)));

    const summaryParts = [
        '<strong>Deduction :</strong> Rs ' + grnPrintFmtCurrency(totals.deduction || 0),
        '<strong>TDS Amount :</strong> Rs ' + grnPrintFmtCurrency(totals.tdsAmount || 0),
        '<strong>Net Payable :</strong> Rs ' + grnPrintFmtCurrency(totals.netPayable || 0),
    ];
    const summaryLine = '<div class="grn-summary-line">' + summaryParts.join(' &nbsp;&nbsp; ') + '</div>';

    const dedRem = grnPickPrintField(masterRemark, ['DeductionRemark', 'deductionRemark', 'DedutionRemark', 'dedutionRemark']);
    const dedRemLine = dedRem
        ? '<div class="grn-summary-line"><strong>Deduction Remark :</strong> ' + grnPrintEscHtml(dedRem) + '</div>'
        : '';

    return '<table class="grn-items" role="presentation">'
        + '<tr class="grn-words-row"><td colspan="' + colCount + '">' + wordsLine + '</td></tr>'
        + '<tr class="grn-summary-row"><td colspan="' + colCount + '">' + summaryLine + dedRemLine + '</td></tr>'
        + '<tr class="grn-remarks-row"><td colspan="' + colCount + '"><strong>Remarks :</strong> '
        + grnPrintEscHtml(grnPickPrintField(masterRemark, ['Remarks', 'remarks', 'Remark', 'remark']))
        + '</td></tr></table>';
}

function grnPrintReportCss() {
    return '@page{size:A4 portrait;margin:8mm 10mm 12mm 10mm;}'
        + '*{box-sizing:border-box;margin:0;padding:0;}'
        + 'body{font-family:Arial,Helvetica,sans-serif;font-size:9pt;color:#000;background:#fff;}'
        + '.no-print{margin-bottom:5mm;}'
        + '@media print{.no-print{display:none!important;}.grn-print-page{page-break-after:always;}.grn-print-page:last-child{page-break-after:auto;}}'
        + '.grn-wrap{max-width:800px;margin:0 auto 14px;padding:0;}'
        + '.grn-co-hdr{text-align:center;margin-bottom:8px;line-height:1.35;}'
        + '.grn-co-name{font-size:15pt;font-weight:800;text-transform:uppercase;margin-bottom:3px;}'
        + '.grn-co-addr{font-size:9pt;margin-bottom:2px;}'
        + '.grn-co-ph{font-size:9pt;margin-bottom:2px;}'
        + '.grn-doc-box{border:1px solid #000;}'
        + '.grn-doc-top{display:flex;border-bottom:1px solid #000;min-height:34px;align-items:center;}'
        + '.grn-doc-top > div{padding:5px 8px;font-size:9.5pt;}'
        + '.grn-doc-top-left{flex:1;border-right:1px solid #000;}'
        + '.grn-doc-top-center{flex:1.2;text-align:center;font-weight:800;font-size:11pt;border-right:1px solid #000;}'
        + '.grn-doc-top-right{flex:1;text-align:right;}'
        + '.grn-doc-body{display:flex;}'
        + '.grn-doc-body > div{flex:1;padding:8px 10px;font-size:9pt;vertical-align:top;min-height:120px;}'
        + '.grn-doc-body-left{border-right:1px solid #000;}'
        + '.grn-sup-lbl{font-weight:700;text-decoration:underline;margin-bottom:6px;}'
        + '.grn-sup-name{font-weight:700;margin-bottom:3px;text-transform:uppercase;}'
        + 'table.grn-meta-mini{width:100%;border-collapse:collapse;}'
        + 'table.grn-meta-mini td{padding:2px 0;font-size:9pt;vertical-align:top;}'
        + '.grn-meta-lbl{width:42%;font-weight:700;padding-right:6px;}'
        + '.grn-meta-val{width:58%;}'
        + 'table.grn-items{width:100%;border-collapse:collapse;table-layout:fixed;}'
        + 'table.grn-items th,table.grn-items td{border:1px solid #000;padding:4px 3px;font-size:8pt;vertical-align:top;word-wrap:break-word;}'
        + 'table.grn-items th{font-weight:700;text-align:center;font-size:7.5pt;line-height:1.2;}'
        + '.grn-tc{text-align:center;}'
        + '.grn-tr{text-align:right;}'
        + '.grn-tl{text-align:left;}'
        + '.grn-po-row td{font-weight:700;font-size:8.5pt;padding:5px 6px;}'
        + '.grn-empty-row td{height:22px;}'
        + '.grn-total-row td{font-weight:800;font-size:9pt;padding:6px 4px;}'
        + '.grn-total-label{text-align:right;padding-right:8px;}'
        + '.grn-words-row td{border:1px solid #000;border-top:none;padding:6px 8px;font-size:9pt;}'
        + '.grn-summary-row td{border:1px solid #000;border-top:none;padding:6px 8px;font-size:9pt;}'
        + '.grn-summary-line{margin-top:2px;line-height:1.45;}'
        + '.grn-summary-line:first-child{margin-top:0;}'
        + '.grn-remarks-row td{border:1px solid #000;border-top:none;padding:6px 8px;font-size:9pt;min-height:28px;}'
        + '.grn-sig-wrap{border:1px solid #000;border-top:none;padding:8px 10px 6px;}'
        + '.grn-sig-for{text-align:right;font-weight:700;font-size:9pt;margin-bottom:28px;}'
        + '.grn-sig-row{display:flex;justify-content:space-between;gap:6px;}'
        + '.grn-sig-row > div{flex:1;text-align:center;font-weight:700;font-size:8.5pt;padding-top:24px;border-top:1px solid #000;margin-top:4px;}';
}

function grnPrintCodeFromListRow(row) {
    return parseInt(
        row?.Code ?? row?.code ?? row?.MRNMaster_Code ?? row?.mRNMaster_Code ?? 0,
        10
    ) || 0;
}

function grnBuildPrintCompanyHeaderHtml(companyInfo) {
    const { companyName, companyAddr, companyTag } = companyInfo || {};
    const addrLine = String(companyAddr || '').trim();
    const phoneLine = String(companyTag || '').trim();
    return '<div class="grn-co-hdr">'
        + '<div class="grn-co-name">' + grnPrintEscHtml(companyName || 'Company Name') + '</div>'
        + (addrLine ? '<div class="grn-co-addr">' + grnPrintEscHtml(addrLine) + '</div>' : '')
        + (phoneLine ? '<div class="grn-co-ph">Ph : ' + grnPrintEscHtml(phoneLine) + '</div>' : '')
        + '</div>';
}

function grnResolvePrintCompanyInfo() {
    return GRNService.GetCompany().catch(function () { return null; }).then(function (companyApi) {
        return grnMergePrintCompanyInfo(
            grnPrintSessionCompany(),
            companyApi ? grnCompanyFromGetCompanyApi(companyApi) : null
        );
    });
}

/** Goods Receipt Note print body — backend GetGRNList / GetGRNByCode data. */
function grnBuildPrintReportInnerHtml(listRow, detailRows, codeNum, companyInfo) {
    detailRows = grnStampPrintDetailProjectSite(detailRows, listRow, null);
    listRow = grnEnrichListRowFromPrintDetails(listRow, detailRows);

    const companyName = (companyInfo && companyInfo.companyName) || '';
    const mrnNo = grnPrintMrnNo(listRow, codeNum);
    const billNo = grnPickPrintField(listRow, ['BillNo', 'billNo', 'Bill No']);
    const billDate = grnPrintFmtDate(listRow?.BillDate ?? listRow?.billDate ?? listRow?.['Bill Date']);
    const docDate = grnPrintFmtDate(new Date());
    const remarks = grnPickPrintField(listRow, ['Remarks', 'remarks', 'Remark', 'remark']);
    const preparedBy = grnPickPrintField(listRow, ['PreparedByName', 'preparedByName', 'PreparedBy', 'preparedBy', 'CreatedByName', 'createdByName']);

    const tableBuilt = grnPrintBuildItemTableRowsHtml(detailRows);
    const colCount = tableBuilt.colCount || 10;
    const totals = grnResolvePrintTotals(listRow, tableBuilt.totalAmt);
    const tableFooterAmt = totals.lineTotalAmt || tableBuilt.totalAmt || 0;

    const metaRight = grnPrintBuildMetaRowHtml('Bill No.', billNo)
        + grnPrintBuildMetaRowHtml('Bill Date', billDate);

    const totalColspan = colCount - 3;

    return '<div class="grn-wrap">'
        + grnBuildPrintCompanyHeaderHtml(companyInfo)
        + '<div class="grn-doc-box">'
        + '<div class="grn-doc-top">'
        + '<div class="grn-doc-top-left"><strong>G.R.N No. :</strong> ' + grnPrintEscHtml(mrnNo) + '</div>'
        + '<div class="grn-doc-top-center">GOODS RECEIPT NOTE</div>'
        + '<div class="grn-doc-top-right"><strong>Date:</strong> ' + grnPrintEscHtml(docDate) + '</div>'
        + '</div>'
        + '<div class="grn-doc-body">'
        + '<div class="grn-doc-body-left">'
        + '<div class="grn-sup-lbl">Supplier\'s Name &amp; Address:</div>'
        + grnPrintBuildSupplierAddressHtml(listRow)
        + '</div>'
        + '<div class="grn-doc-body-right">'
        + '<table class="grn-meta-mini" role="presentation">' + metaRight + '</table>'
        + '</div>'
        + '</div>'
        + '<table class="grn-items"><thead><tr>'
        + '<th style="width:4%;">SNo</th>'
        + '<th style="width:18%;">Item Description</th>'
        + '<th style="width:6%;">UOM</th>'
        + '<th style="width:8%;">Bill Qty</th>'
        + '<th style="width:8%;">Accept Qty</th>'
        + '<th style="width:7%;">Rej. Qty</th>'
        + '<th style="width:7%;">Shortage</th>'
        + '<th style="width:9%;">Rate Rs</th>'
        + '<th style="width:10%;">Amount Rs</th>'
        + '<th style="width:15%;">Remarks</th>'
        + '</tr></thead><tbody>'
        + tableBuilt.html
        + '<tr class="grn-total-row">'
        + '<td colspan="' + totalColspan + '" class="grn-total-label">Total Amount</td>'
        + '<td class="grn-tc">Rs</td>'
        + '<td class="grn-tr">' + grnPrintFmtCurrency(tableFooterAmt) + '</td>'
        + '<td>&nbsp;</td>'
        + '</tr>'
        + '</tbody></table>'
        + grnPrintBuildSummaryFooterHtml(colCount, totals, listRow)
        + '<div class="grn-sig-wrap">'
        + '<div class="grn-sig-for">For ' + grnPrintEscHtml(companyName || 'Company Name') + '</div>'
        + '<div class="grn-sig-row">'
        + '<div>' + grnPrintEscHtml(preparedBy || 'Prepared By') + '</div>'
        + '<div>Received By/Sign. of Store Incharge</div>'
        + '<div>Sign. of Q.C. Deptt</div>'
        + '<div>Authorised Signatory</div>'
        + '</div></div>'
        + '</div></div>';
}

function grnBuildPrintReportDocument(pagesHtml, docTitle) {
    const css = grnPrintReportCss();
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + grnPrintEscHtml(docTitle || 'Goods Receipt Note') + '</title><style>' + css + '</style></head><body>'
        + '<div class="no-print" style="display:flex;gap:8px;padding:3px 0 8px;">'
        + '<button type="button" onclick="window.print()" style="background:#1a2a6c;color:#fff;border:none;padding:5px 16px;border-radius:5px;font-size:9pt;cursor:pointer;">&#128438;&nbsp;Print</button>'
        + '<button type="button" onclick="window.close()" style="background:#666;color:#fff;border:none;padding:5px 12px;border-radius:5px;font-size:9pt;cursor:pointer;">&#10005;&nbsp;Close</button>'
        + '</div>'
        + pagesHtml
        + '</body></html>';
}

function grnBuildPrintReportHtml(listRow, detailRows, codeNum, companyInfo) {
    return grnBuildPrintReportDocument(
        grnBuildPrintReportInnerHtml(listRow, detailRows, codeNum, companyInfo),
        'Goods Receipt Note'
    );
}

function grnResolvePrintDataForCode(codeNum, listRow, detailAll) {
    const formRows = grnPrintDetailsFromFormGrid(codeNum);
    const formListRow = grnPrintListRowFromForm(codeNum);
    if (formRows && formRows.length) {
        return Promise.resolve({
            listRow: Object.assign({}, listRow || {}, formListRow || {}),
            detailRows: formRows,
        });
    }

    let detailRows = grnNormalizePrintDetailRows(grnFilterPrintDetailRows(detailAll, codeNum, listRow));
    if (detailRows.length) {
        return Promise.resolve({
            listRow: listRow,
            detailRows: grnStampPrintDetailProjectSite(detailRows, listRow, null).map(grnNormalizePrintDetailRow),
        });
    }
    return GRNService.GetGRNByCode(codeNum).catch(function () { return null; }).then(function (byCodeResp) {
        const mapped = grnPrintDetailsFromGetByCode(byCodeResp, codeNum, listRow);
        return {
            listRow: grnMergeListRowForPrint(listRow, mapped.master),
            detailRows: mapped.rows,
        };
    });
}

function grnOpenPrintWindow(html, mode) {
    const win = window.open('', '_blank', 'width=920,height=760,scrollbars=yes,resizable=yes');
    if (!win) {
        if (typeof toastr !== 'undefined') toastr.warning('Please allow popups for this site to use the print feature.');
        return;
    }
    win.document.write(html);
    win.document.close();
    if (mode === 'print') {
        setTimeout(function () { win.focus(); win.print(); }, 600);
    }
}

function PrintGRNServiceReport(code, mode, listRowOverride) {
    const codeNum = parseInt(code, 10);
    if (!Number.isFinite(codeNum) || codeNum <= 0) {
        if (typeof toastr !== 'undefined') toastr.warning('Invalid GRN entry.');
        return;
    }
    const listRow = listRowOverride || grnFindListRowForPrint(codeNum) || {};

    Promise.all([
        grnResolvePrintCompanyInfo(),
        GRNService.GetGRNPrintList().catch(function () { return null; }),
    ]).then(function (results) {
        const companyInfo = results[0];
        const printApi = results[1];
        const detailAll = normalizeGrnPrintListRows(printApi);
        return grnResolvePrintDataForCode(codeNum, listRow, detailAll).then(function (resolved) {
            return { resolved: resolved, companyInfo: companyInfo };
        });
    }).then(function (payload) {
        const html = grnBuildPrintReportHtml(
            payload.resolved.listRow,
            payload.resolved.detailRows,
            codeNum,
            payload.companyInfo
        );
        grnOpenPrintWindow(html, mode || 'preview');
    }).catch(function (err) {
        console.error('PrintGRNServiceReport', err);
        if (typeof toastr !== 'undefined') toastr.error('Failed to load GRN print data.');
    });
}

/** Same GRN Service Report for each visible approval/list row. */
function PrintGRNServiceReportBatch(listRows, mode) {
    const rows = (listRows || []).filter(function (r) { return grnPrintCodeFromListRow(r) > 0; });
    if (!rows.length) {
        if (typeof toastr !== 'undefined') toastr.warning('No GRN records to print.');
        return;
    }

    Promise.all([
        grnResolvePrintCompanyInfo(),
        GRNService.GetGRNPrintList().catch(function () { return null; }),
    ]).then(function (results) {
        const companyInfo = results[0];
        const detailAll = normalizeGrnPrintListRows(results[1]);
        let chain = Promise.resolve('');
        rows.forEach(function (row) {
            chain = chain.then(function (pagesHtml) {
                const codeNum = grnPrintCodeFromListRow(row);
                return grnResolvePrintDataForCode(codeNum, row, detailAll).then(function (resolved) {
                    const page = '<div class="grn-print-page">'
                        + grnBuildPrintReportInnerHtml(resolved.listRow, resolved.detailRows, codeNum, companyInfo)
                        + '</div>';
                    return pagesHtml + page;
                });
            });
        });
        return chain;
    }).then(function (pagesHtml) {
        const html = grnBuildPrintReportDocument(pagesHtml, 'Goods Receipt Note');
        grnOpenPrintWindow(html, mode || 'preview');
    }).catch(function (err) {
        console.error('PrintGRNServiceReportBatch', err);
        if (typeof toastr !== 'undefined') toastr.error('Failed to load GRN print data.');
    });
}

function PrintGRNServiceFromList(code, mode, listRowOverride) {
    const codeNum = parseInt(code, 10);
    let listRow = listRowOverride || grnGetApprovalSourceRow(codeNum);
    if (!listRow && typeof window.mrnGetCurrentPaymentForPrint === 'function') {
        listRow = window.mrnGetCurrentPaymentForPrint(codeNum);
    }
    PrintGRNServiceReport(codeNum, mode || 'preview', listRow);
}

function PrintGRNServiceFromDetail(mode) {
    const code = parseInt(document.getElementById('hfGpaPaymentCode')?.value || '0', 10);
    if (!code) {
        if (typeof toastr !== 'undefined') toastr.warning('No GRN selected.');
        return;
    }
    let listRow = grnGetApprovalSourceRow(code);
    if (!listRow && typeof window.mrnGetCurrentPaymentForPrint === 'function') {
        listRow = window.mrnGetCurrentPaymentForPrint(code);
    }
    PrintGRNServiceReport(code, mode || 'preview', listRow);
}

// ══════════════════════════════════════════════════════════════════════════════
// VIEW GRN — open MRN approval detail modal (same as approval cards)
// ══════════════════════════════════════════════════════════════════════════════
function viewGRNFromList(code) {
    var codeNum = parseInt(code, 10);
    if (!Number.isFinite(codeNum) || codeNum <= 0) return;
    var sourceRow = grnGetApprovalSourceRow(codeNum);
    if (typeof window.OpenDetailModal === "function") {
        window.OpenDetailModal(codeNum, { viewOnly: true, sourceRow: sourceRow });
        bindMRNApprovalLevelsFromGRNService(codeNum, sourceRow);
        return;
    }
    if (typeof toastr !== "undefined") {
        toastr.warning("View is not available.");
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// EDIT GRN — load record into form
// ══════════════════════════════════════════════════════════════════════════════
async function editGRN(code) {
    if (!code) return;

    var ModuleName = "GRN Services",
        FinYear = getFinancialYear();

    if (grnIsVerifiedOrApprovedForEditBlockByCode(code)) {
        try {
            var afterVerifyResp = await MenuService.CheckModuleOptionRight(ModuleName, "Edit After Verification", "Y", FinYear);
            if (!afterVerifyResp || afterVerifyResp.CheckModuleOptionRight === "N") {
                if (afterVerifyResp && afterVerifyResp.Msg) {
                    toastr.error(afterVerifyResp.Msg);
                } else {
                    showToast("Verified/approved GRN cannot be edited.", "warning");
                }
                return;
            }
        } catch (e) {
            console.error("editGRN Edit After Verification check:", e);
            showToast("Permission check failed.", "error");
            return;
        }
    }

    try {
        var editRightResp = await MenuService.CheckModuleOptionRight(ModuleName, "Edit", "Y", FinYear);
        if (!editRightResp || editRightResp.CheckModuleOptionRight === "N") {
            toastr.error(editRightResp && editRightResp.Msg ? editRightResp.Msg : "No edit permission.");
            return;
        }
    } catch (e) {
        console.error("editGRN Edit check:", e);
        showToast("Permission check failed.", "error");
        return;
    }

    showToast("Loading GRN...", "info");

    try {
        const resp = await GRNService.GetGRNByCode(code);
        if (!resp) { showToast("GRN not found.", "error"); return; }

        // SP SHOWDATA returns two result sets:
        //   [0] GRNServiceList  → MRNMaster columns + AccountDesp
        //   [1] GRNServiceDetail → MRNDetail columns + ItemName (ItemMaster JOIN) + PONo (PurchaseOrderMaster JOIN)
        const master = (resp.GRNServiceList ?? resp.grnServiceList)?.[0] ?? resp;
        const items = resp.GRNServiceDetail ?? resp.grnServiceDetail ?? [];

        if (grnIsVerifiedOrApprovedForEditBlock(master)) {
            var canEditAfterVerify = await checkGrnEditAfterVerificationRight("Y");
            if (!canEditAfterVerify) {
                showToast("Verified/approved GRN cannot be edited.", "warning");
                return;
            }
        }

        editMode = true;
                editCode = code;
                const hdnMrn = document.getElementById('hdnMRNMasterCode');
                if (hdnMrn) hdnMrn.value = String(code);

                showFillGridCheckbox(false);
                setAddItemBtnState(true);

                // ── Master fields (SP: MRNMaster columns) ────────────────────────────
                const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
                set('txtGRNNo', master.MRNNo ?? '');
                set('txtBillNo', master.BillNo ?? '');
                set('dtBillDate', toInputDate(master.BillDate));
                set('dtRecvDate', toInputDate(master.ReceiveDate));
                set('txtRemark', master.Remarks ?? '');
                const amtStr = v => {
                    if (v === null || v === undefined || v === '') return '0.00';
                    const n = parseFloat(String(v).replace(/,/g, ''));
                    return isNaN(n) ? '0.00' : n.toFixed(2);
                };
                set('txtTotalBillAmountManual', amtStr(master.TotalBillAmountManual));
                set('txtTDSAmount', amtStr(master.TDSAmount ?? master.tdsAmount));
                set('txtDedution', amtStr(master.Dedution));
                set('txtDedutionRemark', master.DedutionRemark ?? master.dedutionRemark ?? master.DeductionRemark ?? '');
                calcNetPayable();

                // Party dropdown — match vendor by saved PartyMaster / Account / Vendor code
                const ddlParty = document.getElementById('ddlPartyName');
                if (ddlParty) {
                    const partyRaw = master.PartyMaster_Code ?? master.partyMaster_Code
                        ?? master.AccountMaster_Code ?? master.accountMaster_Code
                        ?? master.VendorMaster_Code ?? master.vendorMaster_Code ?? '';
                    const pv = partyRaw !== '' && partyRaw !== null && partyRaw !== undefined ? String(partyRaw).trim() : '';
                    if (pv) {
                        let matched = false;
                        for (let i = 0; i < ddlParty.options.length; i++) {
                            const opt = ddlParty.options[i];
                            if (opt.value === pv) {
                                ddlParty.value = pv;
                                matched = true;
                                break;
                            }
                            if (opt.dataset.accountCode === pv || opt.dataset.partyMasterCode === pv) {
                                ddlParty.value = opt.value;
                                matched = true;
                                break;
                            }
                        }
                        if (!matched) ddlParty.value = pv;
                        await loadPOsForParty(ddlParty.value);
                    }
                }

                // Bank dropdown (SP: BankMaster_Code + BankName) — option text = name for save; ensure missing option on stale code
                const ddlBank = document.getElementById('ddlBankName');
                if (ddlBank) {
                    const bcRaw = master.BankMaster_Code ?? master.bankMaster_Code ?? master.Bank_Code ?? '';
                    const bcStr = bcRaw !== '' && bcRaw !== null && bcRaw !== undefined ? String(bcRaw).trim() : '';
                    const bName = String(master.BankName ?? master.bankName ?? '').trim();
                    if (bcStr) {
                        let hasOpt = false;
                        for (let i = 0; i < ddlBank.options.length; i++) {
                            if (ddlBank.options[i].value === bcStr) { hasOpt = true; break; }
                        }
                        if (!hasOpt) ddlBank.add(new Option(bName || ('Bank #' + bcStr), bcStr));
                    }
                    ddlBank.value = bcStr || '';
                }

                // ── Project & Sub Project (edit case) — API: ProjectDesp, SubProjectDesp, pm.ProjectMaster_Code, pm.SubProjectMaster_Code ──
                const projectCode = master.ProjectMaster_Code ?? master.projectMaster_Code ?? items[0]?.ProjectMaster_Code ?? items[0]?.projectMaster_Code ?? '';
                const subProjectCode = master.SubProjectMaster_Code ?? master.subProjectMaster_Code ?? items[0]?.SubProjectMaster_Code ?? items[0]?.subProjectMaster_Code ?? '';
                if (projectCode || subProjectCode) {
                    document.getElementById('chkAgainstProject').checked = true;
                    document.getElementById('divProjectFields').style.display = 'block';
                    document.getElementById('divProjectHint').style.display = 'none';
                    updateProjectFieldsState();
                    await loadSubProjectsForParty();
                    if (subProjectCode) {
                        document.getElementById('frmDdlSubProject').value = String(subProjectCode);
                        await fillProjectFromSubProject(subProjectCode);
                    }
                    if (projectCode && document.getElementById('frmDdlProject')) {
                        document.getElementById('frmDdlProject').value = String(projectCode);
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

                   
                    const itemCode = String(item.ItemMaster_Code ?? '');
                    const itemName = item.ItemName ?? item.itemName ?? itemCode;
                    const itemUomMasterCode = String(item.UOMMaster_Code ?? item.uomMaster_Code ?? '');
                    const itemUom = item.UOM ?? item.uom ?? item.Uom ?? itemUomMasterCode;
                    if (itSel && itemCode) {
                        itSel.innerHTML = '';
                        const opt = new Option(itemName, itemCode);
                        opt.dataset.rate = item.Rate ?? 0;
                        opt.dataset.uom = itemUom;
                        opt.dataset.uomMasterCode = itemUomMasterCode;
                        opt.dataset.purchaseOrderTransactionCode = item.PurchaseOrderTransaction_Code ?? item.PurchaseOrderTransactionCode ?? '';
                        itSel.add(opt);
                        itSel.value = itemCode;
                    }

                    // ── UOM bind (grid uses uom-cell readonly; save uses tr.dataset.uomMasterCode) ──
                    const uomCell = tr.querySelector('.uom-cell');
                    if (uomCell) uomCell.value = itemUom || '';
                    if (itemUomMasterCode) tr.dataset.uomMasterCode = String(itemUomMasterCode);

                    // Store PurchaseOrderTransaction_Code on row (for save on update) — MRNDetail.PurchaseOrderTransaction_Code
                    const poTranCode = item.PurchaseOrderTransaction_Code ?? item.PurchaseOrderTransactionCode ?? '';
                    if (poTranCode) {
                        tr.dataset.purchaseOrderTransactionCode = String(poTranCode);
                        const hf = tr.querySelector('.hf-purchase-order-transaction-code');
                        if (hf) hf.value = String(poTranCode);
                    }

                    // Store MRNDetail Code + MRNMaster_Code on row (for save on update)
                    const detailCode = item.Code ?? item.code ?? '';
                    if (detailCode) tr.dataset.detailCode = String(detailCode);

                    // Quantity / rate / amount / remark cells
                    // SP columns: QtyBill, RejectedQtyBill, GRNRejectedQty, SortageQty, Rate, Amount, Remarks
                    const setCell = (cls, val) => {
                        const el = tr.querySelector(cls);
                        if (el) el.value = val ?? '';
                    };
                    setCell('.bill-qty', item.QtyBill ?? 0);
                    setCell('.accept-qty', item.GRNRejectedQty ?? 0);
                    setCell('.reject-qty', item.RejectedQtyBill ?? 0);
                    const bill = parseFloat(item.QtyBill ?? 0) || 0;
                    const accept = parseFloat(item.GRNRejectedQty ?? 0) || 0;
                    const reject = parseFloat(item.RejectedQtyBill ?? 0) || 0;
                    const shortageCalc = Math.max(0, bill - accept - reject);
                    setCell('.shortage-qty', shortageCalc);
                    setCell('.rate', parseFloat(item.Rate ?? 0).toFixed(2));
                    setCell('.amount', parseFloat(item.Amount ?? 0).toFixed(2));
                    setCell('.row-remark', item.Remarks ?? '');
                    calcRowAmount(tr);
                }

                renumberRows();
                document.getElementById('floatModeBadge').textContent = 'EDIT';
                document.getElementById('floatModeBadge').className = 'po-mode-badge badge bg-warning text-dark';
                updateFloatBar();
                await grnSyncFooterAttachmentFromApis(master, code);
                showFillGridCheckbox(false);  // Ensure hidden in Edit before showing form
                showFormView();
                showToast('GRN loaded for editing.', 'success');
    } catch (e) {
        console.error('editGRN error:', e);
        showToast('Failed to load GRN data.', 'error');
    }
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

                    const delPk = parseInt(String(code), 10) || 0;
                    if (delPk > 0) {
                        AttachmentControlService.DeleteAllAttachment('MRNMaster', delPk, '', 0).catch(function (e) {
                            console.warn('Delete all attachments after GRN delete', e);
                        });
                    }

                    signalMrnApprovalListRefresh();
                    editMode = false;
                    editCode = 0;
                    showListView();
                    await loadGRNList();
                    if (typeof window.reloadMrnApprovalView === 'function') {
                        await window.reloadMrnApprovalView({});
                    } else if (typeof window.LoadPaymentList === 'function') {
                        await window.LoadPaymentList();
                    }
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

   
    const billDate = document.getElementById('dtBillDate')?.value?.trim();

    if (!billNo) {
        showToast('Please enter Bill No.', 'warning');
        document.getElementById('txtBillNo')?.focus();
        return false;
    }
    if (!billDate) {
        showToast('Please enter Bill Date.', 'warning');
        document.getElementById('dtBillDate')?.focus();
        return false;
    }
    if (!party) {
        showToast('Please select Party Name.', 'warning');
        document.getElementById('ddlPartyName')?.focus();
        return false;
    }

    const isAgainstProject = document.getElementById('chkAgainstProject')?.checked;
    if (isAgainstProject) {
        if (!document.getElementById('frmDdlSubProject')?.value) {
            showToast('Please select Sub Project.', 'warning');
            document.getElementById('frmDdlSubProject')?.focus();
            return false;
        }
        if (!document.getElementById('frmDdlProject')?.value) {
            showToast('Please ensure Project is set (choose Sub Project first).', 'warning');
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
        const poVal     = tr.querySelector('.po-select')?.value;
        const itemVal   = tr.querySelector('.item-select')?.value;
        const billQty   = parseFloat(tr.querySelector('.bill-qty')?.value)   || 0;
        const acceptQty = parseFloat(tr.querySelector('.accept-qty')?.value) || 0;
        const rejectQty = parseFloat(tr.querySelector('.reject-qty')?.value) || 0;
        const rate      = parseFloat(tr.querySelector('.rate')?.value)      || 0;

        if (!poVal) {
            // Instead of "select PO", guide user to select party, project and sub project first
            showToast('Please select Party Name and Sub Project to load PO and items.', 'warning');
            document.getElementById('frmDdlSubProject')?.focus();
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
        } else if (acceptQty <= 0 && rejectQty <= 0) {
            showToast(`Row ${i + 1}: Accept Qty or Reject Qty must be greater than 0.`, 'warning');
            valid = false;
        } else if (acceptQty > billQty || rejectQty > billQty || (acceptQty + rejectQty) > billQty) {
            showToast(`Row ${i + 1}: Accept Qty and Reject Qty cannot be greater than Bill Qty. Shortage = Bill Qty - (Accept Qty + Reject Qty).`, 'warning');
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
        }         else {
            if (editMode && grnIsVerifiedOrApprovedForEditBlockByCode(editCode)) {
                var canSaveAfterVerify = await checkGrnEditAfterVerificationRight("Y");
                if (!canSaveAfterVerify) {
                    showToast("Verified/approved GRN cannot be edited.", "warning");
                    return;
                }
            }
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
            //                 PurchaseOrderTransaction_Code, Rate, Amount, SortageQty, GRNRejectedQty, QtyBill, RejectedQtyBill, Remarks
            const GRNServiceDetail = [];
            document.querySelectorAll('#itemTbody tr').forEach(tr => {
                const poSel = tr.querySelector('.po-select');
                const itemSel = tr.querySelector('.item-select');
                // PurchaseOrderTransaction_Code: hidden input → dataset → selected option (for new + update)
                const hfEl = tr.querySelector('.hf-purchase-order-transaction-code');
                let poTranCode = parseInt(hfEl?.value || tr.dataset.purchaseOrderTransactionCode) || 0;
                if (poTranCode === 0 && itemSel?.selectedIndex > 0) {
                    const opt = itemSel.options[itemSel.selectedIndex];
                    poTranCode = parseInt(opt?.dataset?.purchaseOrderTransactionCode) || 0;
                }
                let uomMasterCode = parseInt(tr.dataset.uomMasterCode) || 0;
                if (uomMasterCode === 0 && itemSel?.selectedIndex > 0) {
                    const opt = itemSel.options[itemSel.selectedIndex];
                    uomMasterCode = parseInt(opt?.dataset?.uomMasterCode) || 0;
                }
                const mrnMasterCode = editMode ? editCode : 0;
                GRNServiceDetail.push({
                    Code: parseInt(tr.dataset.detailCode) || 0,  // MRNDetail Code for update; 0 for new
                    MRNMaster_Code: mrnMasterCode,   // Master Code — editCode when update
                    PurchaseOrderMaster_Code: parseInt(poSel?.value) || 0,
                    PurchaseOrderTransaction_Code: poTranCode,  // From GetPOItemDetails - needed to update MRNQtyMT
                    ItemMaster_Code: parseInt(itemSel?.value) || 0,
                    UOMMaster_Code: uomMasterCode,  // PurchaseOrderTransaction.UOMMaster_Code
                    QtyBill: parseFloat(tr.querySelector('.bill-qty')?.value) || 0,
                    GRNRejectedQty: parseFloat(tr.querySelector('.accept-qty')?.value) || 0,
                    RejectedQtyBill : parseFloat(tr.querySelector('.reject-qty')?.value) || 0,
                    SortageQty: parseFloat(tr.querySelector('.shortage-qty')?.value) || 0,
                    Rate: parseFloat(tr.querySelector('.rate')?.value) || 0,
                    Amount: parseFloat(tr.querySelector('.amount')?.value) || 0,
                    Remarks: tr.querySelector('.row-remark')?.value || '',
                });
            });

            // ── GRNServiceList — maps to TY_GRNMaster TVP ────────────────────────────
            // SP TVP columns: Code, BillNo, BillDate, ReceiveDate, PartyMaster_Code, BankMaster_Code, BankName, TransporterName, Remarks,
            //                 TotalBillAmountManual, Dedution, DedutionRemark, NetPayable, Attach*, ...
            //const bankCodeVal = parseInt(document.getElementById('ddlBankName')?.value, 10) || 0;
            const GRNServiceList = [{
                Code: editMode ? editCode : 0,
                MRNNo: 0,
                BillNo: document.getElementById('txtBillNo')?.value || '',
                BillDate: toDateOrFallback('dtBillDate', 'dtGRNDate'),
                ReceiveDate: toDateOrFallback('dtRecvDate', 'dtGRNDate'),
                PartyMaster_Code: parseInt(document.getElementById('ddlPartyName')?.value) || 0,
                //BankMaster_Code: bankCodeVal,
                //BankName: getSelectedBankNameForSave(),
                TransporterName: '',
                Remarks: document.getElementById('txtRemark')?.value || '',
                AttachFileName: '',
                AttachData: [],
                TotalBillAmountManual: parseFloat(document.getElementById('txtTotalBillAmountManual')?.value) || 0,
                TDSAmount: parseFloat(document.getElementById('txtTDSAmount')?.value) || 0,
                Dedution: parseFloat(document.getElementById('txtDedution')?.value) || 0,
                DedutionRemark: document.getElementById('txtDedutionRemark')?.value || '',
                NetPayable: parseFloat(document.getElementById('txtNetPayable')?.value) || 0,

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
                        const savedPk = parseInt(data.Code ?? data.code ?? (editMode ? editCode : 0), 10) || 0;
                        const mrnNoNum = parseInt(String(document.getElementById('txtGRNNo')?.value ?? '').trim(), 10) || parseInt(String(newNo ?? '').trim(), 10) || 0;
                        const billDateForAttach = document.getElementById('dtBillDate')?.value ?? '';
                        if (savedPk > 0 && typeof window.FlushPendingAttachments === 'function') {
                            const flush = await window.FlushPendingAttachments(savedPk, 'MRNMaster', mrnNoNum, billDateForAttach);
                            if (flush && flush.failed > 0) {
                                showToast(flush.uploaded + ' attachment(s) uploaded, ' + flush.failed + ' failed.', 'warning');
                            } else if (flush && flush.uploaded > 0) {
                                showToast(flush.uploaded + ' pending attachment(s) uploaded.', 'success');
                            }
                        }
                        const hdnMrn = document.getElementById('hdnMRNMasterCode');
                        if (hdnMrn && savedPk > 0) hdnMrn.value = String(savedPk);

                        const msg = editMode ? 'GRN updated successfully!' : 'GRN saved successfully!';
                        showToast(msg, 'success');
                        signalMrnApprovalListRefresh();

                        document.getElementById('floatModeBadge').textContent = editMode ? 'UPDATED' : 'SAVED';
                        document.getElementById('floatModeBadge').className = 'po-mode-badge badge bg-primary';

                        editMode = false;
                        editCode = 0;

                        setTimeout(async () => {
                            await loadGRNList();
                            showListView();
                            if (typeof window.reloadMrnApprovalView === 'function') {
                                window.reloadMrnApprovalView({});
                            }
                        }, 1200);
                    } else {
                        showToast(data?.Msg ?? data?.Msg ?? 'Save failed.', 'error');
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
    ['txtGRNNo', 'txtBillNo', 'dtBillDate', 'dtRecvDate', 'txtRemark', 'txtDedutionRemark',
        'txtTotalBillAmountManual', 'txtNetPayable']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

    document.getElementById('ddlPartyName').value             = '';
    const hdnMrn = document.getElementById('hdnMRNMasterCode');
    if (hdnMrn) hdnMrn.value = '0';
    if (typeof window.ClearPendingAttachments_AttachmentControl === 'function') {
        window.ClearPendingAttachments_AttachmentControl();
    }
    document.getElementById('chkAgainstProject').checked      = true;  // Create: Against Project always ON
    document.getElementById('divProjectFields').style.display = 'block';
    initProjectDropdownEmpty();
    document.getElementById('frmDdlSubProject').innerHTML     = '<option value="">-- Select Sub Project --</option>';
    document.getElementById('itemTbody').innerHTML            = '';
    document.getElementById('floatModeBadge').textContent     = 'NEW';
    document.getElementById('floatModeBadge').className       = 'po-mode-badge badge bg-success';

    projectItemsCache = [];
    const chkFill = document.getElementById('chkFillGrid');
    if (chkFill) chkFill.checked = true;
    showFillGridCheckbox(true);

    rowIndex = 0;
    editMode = false; editCode = 0;
    grnFormHasAttachmentYes = false;
    syncGrnFooterAttachmentButtonState(0);
    // Against Project ON by default in Create → hide hint, show project fields, show grid hint
    const hint = document.getElementById('divProjectHint');
    if (hint) hint.style.display = 'none';
    showGridProjectHint();
    setAddItemBtnState(false);
    const tdsEl = document.getElementById('txtTDSAmount');
    if (tdsEl) tdsEl.value = '0.00';
    const dedEl = document.getElementById('txtDedution');
    if (dedEl) dedEl.value = '0.00';
    calcTotal();
    setTodayDates();
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
                <span class="item-card-detail">UOM: ${tr.querySelector('.uom-cell')?.value || '–'}</span>
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
// ATTACHMENT CONTROL (same pattern as Payment Entry — DocumentMaster / MRNMaster)
// ══════════════════════════════════════════════════════════════════════════════
function InitAttachmentControl(masterTableName, masterTableCode, detailTableName, detailTableCode, entryNo, entryDate, mode, sourceDownloadFileName) {
    var url = `${sessionStorage.getItem('AppBaseURL')}/CustomControl/AttachmentControl`;
    $('#GRNService_AttachmentControlmodal').load(url, {
        MasterTableName: masterTableName,
        MasterTableCode: masterTableCode,
        DetailTableName: detailTableName,
        DetailTableCode: detailTableCode,
        EntryNo: entryNo,
        EntryDate: entryDate,
        Mode: mode,
        SourceDownloadFileName: sourceDownloadFileName || ''
    });
}

function openGrnServiceAttachmentControl() {
    const masterCode = parseInt(document.getElementById('hdnMRNMasterCode')?.value ?? '0', 10) || 0;
    const mrnNo = parseInt(document.getElementById('txtGRNNo')?.value?.trim() ?? '0', 10) || 0;
    const entryDate = grnFormatDateInput(document.getElementById('dtBillDate')?.value ?? '');
    InitAttachmentControl('MRNMaster', masterCode, '', 0, mrnNo, entryDate, 'all', '');
}

function openGrnServiceListAttachmentControl(code, entryNo, entryDate) {
    const masterCode = parseInt(code, 10) || 0;
    if (masterCode <= 0) {
        showToast('Invalid record. Cannot open attachments.', 'warning');
        return;
    }
    const resolvedEntryDate = grnResolveAttachmentEntryDate(masterCode, entryDate);
    InitAttachmentControl('MRNMaster', masterCode, '', 0, parseInt(entryNo, 10) || 0, resolvedEntryDate, 'all', '');
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
window.showApprovalView     = showApprovalView;
window.newGRN               = newGRN;
window.PrintGRNServiceFromList = PrintGRNServiceFromList;
window.PrintGRNServiceFromDetail = PrintGRNServiceFromDetail;
window.PrintGRNServiceReport = PrintGRNServiceReport;
window.PrintGRNServiceReportBatch = PrintGRNServiceReportBatch;
window.viewGRNFromList      = viewGRNFromList;
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
window.calcNetPayable       = calcNetPayable;
window.onPOFocus            = onPOFocus;
window.onPOChange           = onPOChange;
window.onItemChange         = onItemChange;
window.toggleProjectFields  = toggleProjectFields;
window.onProjectChange       = onProjectChange;
window.onSubProjectChange     = onSubProjectChange;
window.onProjectFieldFocus    = onProjectFieldFocus;
window.loadGRNList          = loadGRNList;
window.ShowGRNList          = loadGRNList;
window.loadGrnApprovalStatusDropdown = loadGrnApprovalStatusDropdown;
window.loadGrnListStatusDropdown = loadGrnListStatusDropdown;
window.applyMrnApprovalDefaultPendingStatus = applyMrnApprovalDefaultPendingStatus;
window.resolveGrnDropdownStatusCode = resolveGrnDropdownStatusCode;
window.setGrnListPendingOnMeBadge = setGrnListPendingOnMeBadge;
window.syncGrnListHeaderTabsFromApprovalChips = syncGrnListHeaderTabsFromApprovalChips;
window.grnGetApprovalSourceRow = grnGetApprovalSourceRow;
window.navigateToMRNMasterApproval = navigateToMRNMasterApproval;
window.navigateToMRNMasterApprovalPendingOnMe = navigateToMRNMasterApprovalPendingOnMe;
window.navigateToGRNServiceApprovalConfiguration = navigateToGRNServiceApprovalConfiguration;
window.resolveGrnMultilevelVerificationFromStorage = resolveGrnMultilevelVerificationFromStorage;
window.setGrnMultilevelVerification = setGrnMultilevelVerification;
window.VerifyGRN            = VerifyGRN;
window.CloseGRNVerifyModal  = CloseGRNVerifyModal;
window.DoGRNVerify          = DoGRNVerify;
window.closeGrnVerifyDetailPopover = closeGrnVerifyDetailPopover;
window.InitAttachmentControl = InitAttachmentControl;
window.openGrnServiceAttachmentControl = openGrnServiceAttachmentControl;
window.openGrnServiceListAttachmentControl = openGrnServiceListAttachmentControl;
window.grnResolveAttachmentEntryDate = grnResolveAttachmentEntryDate;
window.syncGrnFooterAttachmentButtonState = syncGrnFooterAttachmentButtonState;
window.showAllItems         = showAllItems;
window.onAddItemClick       = onAddItemClick;
window.onPartyChange        = onPartyChange;
window.onFillGridChange     = onFillGridChange;
window.calcAddItemModalAmount   = calcAddItemModalAmount;
window.onAddItemModalPOChange   = onAddItemModalPOChange;
window.onAddItemModalItemChange = onAddItemModalItemChange;
window.saveAddItemModalToGrid   = saveAddItemModalToGrid;

