import { VendorMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/VendorMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { AttachmentControlService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_AttachmentControlService.js';
import { CheckGSTNStatus } from '../../Bizsol.WebERP.UI.Shared/js/CheckGSTINStatus.js?v=20260615_3';

var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
var G_UserMasterCode = authKeyData.UserMaster_Code;
var G_EditCode = 0;
var G_ViewCode = 0;
var G_VendorVerifyCode = 0;
let G_IsClientOrVendor = 'N';
let G_ModuleName = "Vendor Master";
/** When true, BillName (Display Name) follows AccountDesp (Vendor Name) on input. */
let G_BillNameSyncedWithVendorName = true;
window.G_VendorHasVerifyRight = false;
/** From GetFixedParameterDetails; when Y, show stats strip + Verify column (with menu Verify right). */
window.G_PartyVerificationBeforeOrderY = false;
/** Raw rows from VendorMaster GetCityList (may include state/country/pin per city). */
let G_VendorCityMasterList = [];
/** When true, skip auto-fill of Nation/State/Pin from City (e.g. Edit load). */
let G_VendorSuppressCityAddressFill = false;
/** When true, Nation/State change must not cascade-clear City/State (edit load / city-driven fill). */
let G_VendorProgrammaticNationStateCity = false;
let G_GSTINValidatedNo = "";

/** DocumentMaster — same table key as other Account / party attachments (e.g. Lead). */
var VM_ATTACHMENT_MASTER_TABLE = "AccountMaster";

/** Letterhead for vendor/client register print preview (replaces session “Solar” branding). */
function vmGetPrintPreviewHeaderInfo() {
    return {
        companyName: "PURSHOTAM PROFILES PVT.LTD.",
        tagline: "OPTIMISING STRUCTURAL SOLUTIONS",
        companyPhone: "011-47049127",
        companyEmail: "info@purshotamgroup.com",
        companyWeb: "www.purshotamgroup.com",
        footerAddress: "City Tower, 2nd Floor, Netaji Subhash Place, Pitampura, Delhi-110034",
    };
}

/** Legacy single-file attachment from API (bytes + file name) for view/print. */
let vmVendorFileName = "";
let vmVendorImageBase64Data = [];
let vmVendorExistingImageData = [];
let vmVendorExistingFileName = "";
/** View modal — attachment from SHOWDATA (optional 4th result AttachInfo). */
let G_VendorViewAttachData = null;
let G_VendorViewAttachFileName = "";

function vmVendorAttachmentHasData(data) {
    if (data == null) return false;
    if (typeof data === "string" && data.length > 0) return true;
    if (Array.isArray(data) && data.length > 0) return true;
    return false;
}

function vmConvertFileToByteArray(file) {
    return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onloadend = function (e) {
            if (e.target.readyState === FileReader.DONE) {
                resolve(Array.from(new Uint8Array(e.target.result)));
            }
        };
        reader.onerror = reject;
    });
}

function vmResetVendorAttachment() {
    vmVendorFileName = "";
    vmVendorImageBase64Data = [];
    vmVendorExistingImageData = [];
    vmVendorExistingFileName = "";
    var legacyRow = document.getElementById("vmLegacyAttachRow");
    if (legacyRow) legacyRow.style.display = "none";
    var vbtn = document.getElementById("vmViewAttachmentBtn");
    if (vbtn) vbtn.style.removeProperty("display");
    if (typeof window.ClearPendingAttachments_AttachmentControl === "function") {
        window.ClearPendingAttachments_AttachmentControl();
    }
}

function vmParseVendorAttachmentFromApiResponse(raw, item) {
    var attachList = raw && (raw.AttachInfo || raw.attachInfo);
    var attachInfo = Array.isArray(attachList) && attachList.length > 0 ? attachList[0] : null;
    var fileName =
        (attachInfo && (attachInfo.AttachFileName || attachInfo.attachFileName)) ||
        (item && (item.AttachFileName || item.attachFileName)) ||
        "";
    var fromAttach = attachInfo && (attachInfo.AttachData != null ? attachInfo.AttachData : attachInfo.attachData);
    var fromItem = item && (item.AttachData != null ? item.AttachData : item.attachData);
    var data = fromAttach != null ? fromAttach : fromItem != null ? fromItem : [];
    return { fileName: fileName, data: data };
}

function vmApplyVendorAttachmentFromApi(raw, item) {
    var p = vmParseVendorAttachmentFromApiResponse(raw, item);
    vmVendorExistingFileName = p.fileName;
    vmVendorExistingImageData = p.data;
    vmVendorImageBase64Data = [];
    vmVendorFileName = "";
    var legacyRow = document.getElementById("vmLegacyAttachRow");
    var vbtn = document.getElementById("vmViewAttachmentBtn");
    if (legacyRow && vbtn) {
        if (vmVendorAttachmentHasData(vmVendorExistingImageData)) {
            legacyRow.style.display = "flex";
            if (vmVendorExistingFileName) vbtn.title = vmVendorExistingFileName;
        } else {
            legacyRow.style.display = "none";
        }
    }
    if (item && typeof item === "object") {
        window.vmVendorFormHasAttachmentYes =
            vmVendorHasAttachmentYesFromItem(item) || vmVendorResolveHasAttachmentYesFromGridList(item);
    }
    vmSyncVendorFormAttachBarState(0);
}

function vmFileUploadChange(event) {
    var files = event && event.target ? event.target.files : null;
    vmVendorFileName = files && files[0] ? files[0].name : "";
    var legacyRow = document.getElementById("vmLegacyAttachRow");
    var vbtn = document.getElementById("vmViewAttachmentBtn");
    if (files && files.length > 0) {
        vmConvertFileToByteArray(files[0]).then(function (b) {
            vmVendorImageBase64Data = b;
            if (legacyRow) legacyRow.style.display = "flex";
        });
    } else {
        vmVendorImageBase64Data = [];
        if (legacyRow && vbtn) {
            if (vmVendorAttachmentHasData(vmVendorExistingImageData)) {
                legacyRow.style.display = "flex";
            } else {
                legacyRow.style.display = "none";
            }
        }
    }
}

function vmViewAttachment() {
    var data =
        vmVendorImageBase64Data.length > 0 ? vmVendorImageBase64Data : vmVendorExistingImageData;
    var name = vmVendorFileName || vmVendorExistingFileName || "attachment";
    vmOpenAttachmentPreview(data, name);
}

function vmViewVendorAttachmentFromModal() {
    vmOpenAttachmentPreview(G_VendorViewAttachData, G_VendorViewAttachFileName);
}

function vmEscapeHtml(s) {
    if (s == null || s === undefined) return "";
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function vmGetSessionCompanyInfo() {
    var companyName = "",
        companyAddr = "",
        companyPhone = "",
        companyEmail = "",
        companyWeb = "",
        companyGST = "";
    try {
        var ud = JSON.parse(sessionStorage.getItem("UserDetails") || "[]");
        if (ud && ud[0]) {
            companyName = ud[0].CompanyName || ud[0].CompanyNameForShow || "";
            companyAddr = ud[0].CompanyAddress || "";
            companyPhone = ud[0].PhoneNo || ud[0].CompanyPhone || "";
            companyEmail = ud[0].Email || ud[0].CompanyEmail || "";
            companyWeb = ud[0].Website || ud[0].CompanyWebsite || "";
            companyGST = ud[0].GSTIN || ud[0].CompanyGSTIN || "";
        }
    } catch (e) {}
    return {
        companyName: companyName,
        companyAddr: companyAddr,
        companyPhone: companyPhone,
        companyEmail: companyEmail,
        companyWeb: companyWeb,
        companyGST: companyGST,
    };
}

/** Build data URL for attachment bytes or base64 string (same rules as preview). */
function vmBuildDataUrlFromAttachment(data, fileName) {
    var name = fileName || "attachment";
    if (!vmVendorAttachmentHasData(data)) return "";
    if (typeof data === "string") {
        return data.indexOf("data:") === 0 ? data : "data:image/jpeg;base64," + data;
    }
    if (Array.isArray(data) && data.length > 0) {
        var bytes = new Uint8Array(data);
        var binary = "";
        bytes.forEach(function (b) {
            binary += String.fromCharCode(b);
        });
        var b64 = btoa(binary);
        var ext = (name.split(".").pop() || "jpeg").toLowerCase();
        var mime = ext === "pdf" ? "application/pdf" : "image/" + (ext === "jpg" ? "jpeg" : ext);
        return "data:" + mime + ";base64," + b64;
    }
    return "";
}

function vmDownloadVendorAttachment(data, fileName) {
    if (!vmVendorAttachmentHasData(data)) {
        toastr.info("No attachment to download.");
        return;
    }
    var src = vmBuildDataUrlFromAttachment(data, fileName);
    if (!src) {
        toastr.warning("Cannot prepare download.");
        return;
    }
    var a = document.createElement("a");
    a.href = src;
    a.download = fileName || "attachment";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/** Last attachment shown in preview (for Download from child window). */
window.vmLastVendorAttachmentForDownload = { data: null, fileName: "" };

function vmOpenVendorAttachmentPrintWindow(data, fileName, autoPrint) {
    var src = vmBuildDataUrlFromAttachment(data, fileName);
    if (!src) {
        toastr.warning("Cannot print this attachment.");
        return;
    }
    var extLower = ((fileName || "").split(".").pop() || "").toLowerCase();
    var isPdf = extLower === "pdf";
    var win = window.open("", "_blank", "width=920,height=760,scrollbars=yes,resizable=yes");
    if (!win) {
        toastr.warning("Please allow popups for print.");
        return;
    }
    var safeTitle = vmEscapeHtml(fileName || "attachment");
    var css =
        "@page{size:A4 portrait;margin:10mm;}" +
        "*{box-sizing:border-box;margin:0;padding:0;}" +
        "body{font-family:Arial,Helvetica,sans-serif;font-size:10pt;background:#fff;}" +
        ".no-print{margin-bottom:8px;display:flex;gap:8px;}" +
        "@media print{.no-print{display:none!important;}}" +
        ".wrap{padding:8px;}" +
        "img{max-width:100%;height:auto;display:block;margin:0 auto;}" +
        "iframe{width:100%;min-height:85vh;border:none;}";
    var bodyInner = isPdf
        ? '<iframe src="' + src.replace(/"/g, "&quot;") + '"></iframe>'
        : '<img alt="' + safeTitle + '" src="' + src.replace(/"/g, "&quot;") + '" />';
    var html =
        "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>" +
        safeTitle +
        "</title><style>" +
        css +
        "</style></head><body><div class=\"no-print\">" +
        '<button type="button" onclick="window.print()" style="background:#1a2a6c;color:#fff;border:none;padding:6px 16px;border-radius:5px;cursor:pointer;">Print</button>' +
        '<button type="button" onclick="window.close()" style="background:#666;color:#fff;border:none;padding:6px 12px;border-radius:5px;cursor:pointer;">Close</button>' +
        "</div><div class=\"wrap\">" +
        bodyInner +
        "</div></body></html>";
    win.document.write(html);
    win.document.close();
    if (autoPrint) {
        setTimeout(function () {
            win.focus();
            win.print();
        }, 600);
    }
}

/** Image lightbox + PDF window: register attachment for Download / print helpers. */
function vmRegisterLastAttachmentForActions(data, fileName) {
    window.vmLastVendorAttachmentForDownload = { data: data, fileName: fileName || "attachment" };
}

/** Image lightbox / PDF — open with toolbar: Download, Print preview, Print, Close. */
function vmOpenAttachmentPreview(data, name) {
    var fileName = name || "attachment";
    vmRegisterLastAttachmentForActions(data, fileName);
    if (!vmVendorAttachmentHasData(data)) {
        toastr.info("No attachment to view.");
        return;
    }
    var src = "";
    if (typeof data === "string") {
        src = data.indexOf("data:") === 0 ? data : "data:image/jpeg;base64," + data;
    } else if (Array.isArray(data) && data.length > 0) {
        var bytes = new Uint8Array(data);
        var binary = "";
        bytes.forEach(function (b) {
            binary += String.fromCharCode(b);
        });
        var b64 = btoa(binary);
        var ext = (fileName.split(".").pop() || "jpeg").toLowerCase();
        var mime = ext === "pdf" ? "application/pdf" : "image/" + (ext === "jpg" ? "jpeg" : ext);
        src = "data:" + mime + ";base64," + b64;
    }
    if (!src) {
        toastr.warning("Cannot display attachment.");
        return;
    }
    var extLower = (fileName.split(".").pop() || "").toLowerCase();
    if (extLower === "pdf") {
        var winPdf = window.open("", "_blank", "width=920,height=760,scrollbars=yes,resizable=yes");
        if (!winPdf) {
            toastr.warning("Please allow popups for this site.");
            return;
        }
        var safeName = vmEscapeHtml(fileName);
        var escSrc = src.replace(/"/g, "&quot;");
        winPdf.document.write(
            "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>" +
                safeName +
                "</title><style>body{margin:0;font-family:Arial,sans-serif;}" +
                ".vm-att-toolbar{display:flex;gap:8px;align-items:center;padding:8px;background:#f3f4f6;border-bottom:1px solid #ccc;}" +
                "@media print{.vm-att-toolbar{display:none!important;}}" +
                "iframe{width:100%;height:calc(100vh - 52px);border:none;}</style></head><body>" +
                '<div class="vm-att-toolbar">' +
                '<button type="button" onclick="window.print()" style="background:#1a2a6c;color:#fff;border:none;padding:6px 14px;border-radius:5px;cursor:pointer;">Print</button>' +
                '<button type="button" onclick="(function(){var x=window.opener&&window.opener.vmLastVendorAttachmentForDownload;if(x&&x.data)window.opener.vmDownloadVendorAttachment(x.data,x.fileName);})()" style="background:#059669;color:#fff;border:none;padding:6px 14px;border-radius:5px;cursor:pointer;">Download</button>' +
                '<button type="button" onclick="window.close()" style="background:#666;color:#fff;border:none;padding:6px 12px;border-radius:5px;cursor:pointer;">Close</button>' +
                "</div>" +
                '<iframe src="' +
                escSrc +
                '"></iframe></body></html>'
        );
        winPdf.document.close();
        return;
    }
    var lb = document.getElementById("vmImgLightbox");
    if (lb && !document.getElementById("vmLbToolbar")) {
        lb.parentNode.removeChild(lb);
        lb = null;
    }
    if (!lb) {
        lb = document.createElement("div");
        lb.id = "vmImgLightbox";
        lb.style.cssText =
            "position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:100000;display:flex;" +
            "flex-direction:column;align-items:center;justify-content:center;cursor:pointer;";
        lb.innerHTML =
            '<div id="vmLbToolbar" style="position:absolute;top:12px;left:50%;transform:translateX(-50%);display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:center;z-index:100001;" onclick="event.stopPropagation();">' +
            '<button type="button" id="vmLbDl" style="background:#059669;color:#fff;border:none;padding:8px 14px;border-radius:8px;font-size:0.8rem;font-weight:600;cursor:pointer;">Download</button>' +
            '<button type="button" id="vmLbPrintPrev" style="background:#1a2a6c;color:#fff;border:none;padding:8px 14px;border-radius:8px;font-size:0.8rem;font-weight:600;cursor:pointer;">Print preview</button>' +
            '<button type="button" id="vmLbPrint" style="background:#374151;color:#fff;border:none;padding:8px 14px;border-radius:8px;font-size:0.8rem;font-weight:600;cursor:pointer;">Print</button>' +
            '<span id="vmLbName" style="color:#fff;font-size:0.8rem;opacity:0.85;max-width:40vw;overflow:hidden;text-overflow:ellipsis;"></span>' +
            '<button type="button" id="vmLbClose" style="background:#fff;border:none;border-radius:50%;width:34px;height:34px;font-size:1.1rem;cursor:pointer;line-height:1;">✕</button></div>' +
            '<img id="vmLbImg" style="max-width:90vw;max-height:78vh;border-radius:10px;margin-top:48px;' +
            'box-shadow:0 8px 40px rgba(0,0,0,0.6);object-fit:contain;cursor:default;" onclick="event.stopPropagation();" />';
        lb.onclick = function (e) {
            if (e.target === lb) lb.style.display = "none";
        };
        document.body.appendChild(lb);
        document.getElementById("vmLbClose").onclick = function (ev) {
            ev.stopPropagation();
            lb.style.display = "none";
        };
    }
    var imgEl = document.getElementById("vmLbImg");
    var nameEl = document.getElementById("vmLbName");
    if (nameEl) nameEl.textContent = fileName;
    if (imgEl) imgEl.src = src;
    var bindBtn = function (id, fn) {
        var b = document.getElementById(id);
        if (b) {
            b.onclick = function (ev) {
                ev.stopPropagation();
                fn();
            };
        }
    };
    bindBtn("vmLbDl", function () {
        var x = window.vmLastVendorAttachmentForDownload;
        if (x && x.data) vmDownloadVendorAttachment(x.data, x.fileName);
    });
    bindBtn("vmLbPrintPrev", function () {
        var x = window.vmLastVendorAttachmentForDownload;
        if (x && x.data) vmOpenVendorAttachmentPrintWindow(x.data, x.fileName, false);
    });
    bindBtn("vmLbPrint", function () {
        var x = window.vmLastVendorAttachmentForDownload;
        if (x && x.data) vmOpenVendorAttachmentPrintWindow(x.data, x.fileName, true);
    });
    lb.style.display = "flex";
}

function vmDownloadVendorAttachmentFromViewModal() {
    vmDownloadVendorAttachment(G_VendorViewAttachData, G_VendorViewAttachFileName);
}

function vmParseVendorPrintPayload(res) {
    var parsed = vmResolveVendorMasterItemFromApiResponse(res);
    var raw = parsed.raw;
    var item = parsed.item;
    if (!item || typeof item !== "object") return null;
    var cpList = raw && (raw.AccountContactPersonDetail || raw.accountContactPersonDetail || raw.Table3 || (Array.isArray(raw) && raw[2]));
    var cp = Array.isArray(cpList) && cpList.length > 0 ? cpList[0] : null;
    var bkList = raw && (raw.BankAccountDetail || raw.bankAccountDetail || raw.Table2 || (Array.isArray(raw) && raw[1]));
    var bk = Array.isArray(bkList) && bkList.length > 0 ? bkList[0] : null;
    var vAtt = vmParseVendorAttachmentFromApiResponse(raw, item);
    return { item: item, cp: cp, bk: bk, attach: vAtt };
}

/** Industry label for print / display when API has Code but not name (same lookup as view). */
function vmResolveIndustryTypeLabelAsync(item) {
    if (!item) return Promise.resolve("—");
    var label = vmVendorPickFirst(item, [
        "IndustryTypeMaster_Name",
        "IndustryTypeName",
        "IndustryType",
        "IndustryTypeDesp",
        "Industry_Type"
    ]);
    if (label) return Promise.resolve(String(label));
    var code = vmVendorPickFirst(item, [
        "IndustryTypeMaster_Code",
        "industryTypeMaster_Code",
        "IndustryTypeMasterCode"
    ]);
    if (code === undefined || code === null || String(code).trim() === "" || String(code) === "0") {
        return Promise.resolve("—");
    }
    return VendorMasterService.GetIndustryType()
        .then(function (resObj) {
            var raw = resObj && (resObj.data || resObj.Data || resObj);
            var rows = Array.isArray(raw) ? raw : [];
            var c = parseInt(String(code), 10);
            if (!Number.isFinite(c)) return String(code);
            for (var i = 0; i < rows.length; i++) {
                var r = rows[i];
                var rc = parseInt(String(r.Code != null ? r.Code : r.code), 10);
                if (Number.isFinite(rc) && rc === c) {
                    var name = (r.IndustryType || r.industryType || r.Desp || "").trim();
                    return name || "—";
                }
            }
            return "—";
        })
        .catch(function () {
            return String(code);
        });
}

function vmBuildVendorMasterPrintHtml(payload) {
    var item = payload.item;
    var cp = payload.cp;
    var bk = payload.bk;
    var att = payload.attach || { fileName: "", data: null };
    var co = vmGetSessionCompanyInfo();
    var pp = vmGetPrintPreviewHeaderInfo();
    var hdrContact = "";
    if (pp.companyPhone) hdrContact += "&#9990;&nbsp;" + vmEscapeHtml(pp.companyPhone) + "<br>";
    if (pp.companyEmail) hdrContact += "&#9993;&nbsp;" + vmEscapeHtml(pp.companyEmail) + "<br>";
    if (pp.companyWeb) hdrContact += "&#127760;&nbsp;" + vmEscapeHtml(pp.companyWeb) + "<br>";
    if (co.companyGST) hdrContact += "GSTIN:&nbsp;" + vmEscapeHtml(co.companyGST);

    var logoUrl =
        (sessionStorage.getItem("AppBaseURL") || (window.location.origin + "/")).replace(/\/?$/, "/") +
        "assets/images/pppllog.jpeg";

    var panView = item.PANNo || "";
    var gstForPan = vmVendorPickFirst(item, ["GSTNNo", "GSTN No", "gstnNo"]);
    if (!panView && gstForPan) {
        var gV = String(gstForPan).trim().toUpperCase();
        if (gV.length === 15 && isValidGstinFormat(gV)) {
            panView = gV.substring(2, 12);
        }
    }

    /** Same value as list grid — supports API aliases ("Vendor Name", "GSTN No", "Pin Code", …). */
    var gridVendorName = vmVendorPickFirst(item, ["Vendor Name", "AccountDesp", "Client Name"]);
    var gridNature = vmVendorPickFirst(item, ["Nature", "AccountNature", "accountNature"]);
    var gridGstn = vmVendorPickFirst(item, ["GSTNNo", "GSTN No", "gstnNo"]);
    var gridPhone = vmVendorPickFirst(item, ["PhoneNo", "Phone"]);
    var gridEmail = vmVendorPickFirst(item, ["EMail", "Email", "email"]);
    var gridCity = vmVendorPickFirst(item, ["City", "city"]);
    var gridState = vmVendorPickFirst(item, ["State", "state"]);
    var gridCountry = vmVendorPickFirst(item, ["Nation", "Country", "country"]);
    var gridPin = vmVendorPickFirst(item, ["PinCode", "Pin Code", "pinCode"]);

    function cellVal(val) {
        if (val == null || String(val).trim() === "") return "—";
        return String(val);
    }

    /** Two label–value pairs per row (compact, PO-style single page). */
    function row2(l1, v1, l2, v2) {
        return (
            "<tr>" +
            '<td class="lbl">' +
            vmEscapeHtml(l1) +
            '</td><td class="val">' +
            vmEscapeHtml(cellVal(v1)) +
            '</td><td class="lbl">' +
            vmEscapeHtml(l2) +
            '</td><td class="val">' +
            vmEscapeHtml(cellVal(v2)) +
            "</td></tr>"
        );
    }

    function rowFull(label, val) {
        return (
            "<tr>" +
            '<td class="lbl">' +
            vmEscapeHtml(label) +
            '</td><td class="val" colspan="3">' +
            vmEscapeHtml(cellVal(val)) +
            "</td></tr>"
        );
    }

    var industryLabel =
        payload.industryTypeLabel !== undefined
            ? payload.industryTypeLabel
            : vmVendorPickFirst(item, [
                  "IndustryTypeMaster_Name",
                  "IndustryTypeName",
                  "IndustryType",
                  "IndustryTypeDesp",
              ]) || "—";

    var attachBlock = "";
    if (vmVendorAttachmentHasData(att.data)) {
        var ext = ((att.fileName || "").split(".").pop() || "").toLowerCase();
        var srcAtt = vmBuildDataUrlFromAttachment(att.data, att.fileName);
        if (ext === "pdf") {
            attachBlock =
                '<div class="att-note"><b>Attachment : </b>' +
                vmEscapeHtml(att.fileName || "file") +
                " (PDF) — use Download from screen to save.</div>";
        } else if (srcAtt) {
            attachBlock =
                '<div class="att-wrap"><div class="sec-band" style="margin-top:4px;">Attachment</div><img class="att-img" src="' +
                srcAtt.replace(/"/g, "&quot;") +
                '" alt="attachment" /></div>';
        }
    }

    var css =
        "@page{size:A4 portrait;margin:8mm 10mm 20mm 10mm;}" +
        "*{box-sizing:border-box;margin:0;padding:0;}" +
        "body{font-family:Arial,Helvetica,sans-serif;font-size:8.5pt;color:#000;background:#fff;padding:0;position:relative;}" +
        ".no-print{margin-bottom:4mm;}" +
        "@media print{.no-print{display:none!important;}}" +
        ".po-hdr{display:flex;align-items:flex-start;padding-bottom:5px;border-bottom:2.5px solid #000;margin-bottom:5px;}" +
        ".hdr-co{flex:1;}" +
        ".hdr-name{font-size:14pt;font-weight:800;color:#000;letter-spacing:0.3px;line-height:1.2;}" +
        ".hdr-tag{font-size:8pt;color:#000;letter-spacing:1px;margin-top:1px;font-weight:700;}" +
        ".hdr-contact{text-align:right;font-size:8pt;color:#000;line-height:1.75;min-width:155px;font-weight:600;}" +
        ".hdr-logo{width:65px;height:65px;object-fit:contain;margin-right:14px;flex-shrink:0;}" +
        ".hdr-left{display:flex;align-items:center;flex:1;}" +
        ".po-title{text-align:center;font-size:10pt;font-weight:800;border:2px solid #000;color:#000;padding:3px 0;margin:4px 0;letter-spacing:1.2px;}" +
        ".sec-band{border-top:2.5px solid #000;border-bottom:2.5px solid #000;font-weight:800;font-size:9pt;padding:3px 8px;margin:5px 0 3px;letter-spacing:0.5px;color:#000;text-transform:uppercase;}" +
        "table.fld{width:100%;border-collapse:collapse;table-layout:fixed;}" +
        "table.fld td{padding:3px 6px;border:1px solid #555;font-size:8.5pt;vertical-align:top;line-height:1.35;}" +
        "table.fld .lbl{width:18%;font-weight:700;background:#f7f8fa;padding-left:8px;}" +
        "table.fld .val{width:32%;font-weight:600;word-wrap:break-word;}" +
        ".att-wrap{margin-top:4px;text-align:center;padding:4px 2px;}" +
        ".att-img{max-height:100px;max-width:100%;object-fit:contain;}" +
        ".att-note{font-size:8pt;margin-top:4px;padding:6px 8px;border:1px dashed #555;}" +
        ".print-footer{position:fixed;bottom:0;left:0;right:0;z-index:2;padding:6px 10mm 10px;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}" +
        ".print-footer-addr{text-align:center;font-family:Georgia,'Times New Roman',Times,serif;font-size:8.5pt;color:#6d7d92;line-height:1.45;margin:0 0 6px;padding:0 8px;}" +
        ".print-footer-addr .print-footer-pin{margin-right:4px;}" +
        ".print-footer-strip{height:22px;width:100%;background:linear-gradient(102deg,#d4c6e6 0%,#d4c6e6 44.5%,#ffffff 44.5%,#ffffff 47.2%,#d8dce2 47.2%,#d8dce2 100%);}" +
        ".wm-logo{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:320px;height:320px;background:url(" +
        logoUrl.replace(/\(/g, "%28").replace(/\)/g, "%29") +
        ") no-repeat center;background-size:contain;opacity:0.07;pointer-events:none;z-index:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}" +
        ".print-main{position:relative;z-index:1;padding-bottom:96px;}";

    var docTitle = G_ModuleName === "Vendor Master" ? "VENDOR REGISTRATION FORM" : "CLIENT REGISTRATION FORM";
    var codeLabel = G_ModuleName === "Vendor Master" ? "Vendor Code" : "Client Code";
    var vendorNameLabel = G_ModuleName === "Vendor Master" ? "Vendor Name" : "Client Name";
    var secBandMain =
        G_ModuleName === "Vendor Master" ? "Vendor &amp; registration" : "Client &amp; registration";

    var html =
        "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>" +
        docTitle +
        " — " +
        vmEscapeHtml(item.AccountDesp || "") +
        "</title><style>" +
        css +
        "</style></head><body>" +
        '<div class="no-print" style="display:flex;gap:8px;padding:3px 0 6px;">' +
        '<button type="button" onclick="window.print()" style="background:#1a2a6c;color:#fff;border:none;padding:5px 16px;border-radius:5px;font-size:9pt;cursor:pointer;">Print</button>' +
        '<button type="button" onclick="window.close()" style="background:#666;color:#fff;border:none;padding:5px 12px;border-radius:5px;font-size:9pt;cursor:pointer;">Close</button>' +
        "</div>" +
        '<div class="wm-logo"></div>' +
        '<div class="print-main" id="printpreview">' +
        '<div class="po-hdr">' +
        '<div class="hdr-left"><img class="hdr-logo" src="' +
        logoUrl.replace(/"/g, "&quot;") +
        '" alt="Logo"><div class="hdr-co"><div class="hdr-name">' +
        vmEscapeHtml(pp.companyName) +
        '</div><div class="hdr-tag">' +
        vmEscapeHtml(pp.tagline) +
        "</div></div></div>" +
        '<div class="hdr-contact">' +
        hdrContact +
        "</div></div>" +
        '<div class="po-title">' +
        docTitle +
        "</div>" +
        '<div class="sec-band">' +
        secBandMain +
        "</div>" +
        "<table class=\"fld\"><tbody>" +
        row2(codeLabel, cellVal(item.VendorCode), vendorNameLabel, gridVendorName) +
        row2("Industry Type", industryLabel, "Nature", gridNature) +
        row2("Display Name", item.BillName, "GSTN No", gridGstn) +
        row2("PAN Number", panView, "Address Line 1", item.Address1) +
        row2("Address Line 2", item.Address2, "Country", gridCountry) +
        row2("City", gridCity, "State", gridState) +
        row2("Pin Code", gridPin, "Email", gridEmail) +
        rowFull("Phone", gridPhone) +
        "</tbody></table>";

    html +=
        '<div class="sec-band">Contact person</div>' +
        "<table class=\"fld\"><tbody>" +
        row2("Contact Name", cp && cp.ContactPersonName, "Designation", cp && cp.ContactPersonDesignation) +
        row2("Contact Mobile", cp && cp.ContactPersonMobile, "Contact Email", cp && cp.ContactPersonEMail) +
        "</tbody></table>" +
        '<div class="sec-band">Bank details</div>' +
        "<table class=\"fld\"><tbody>" +
        row2("Bank Name", bk && (bk.BankName || bk.bankName), "Account No", bk && (bk.AccountNo || bk.accountNo)) +
        rowFull("Bank Address", bk && (bk.Address || bk.address)) +
        rowFull("IFSC Code", bk && (bk.IFSCCode || bk.ifscCode)) +
        "</tbody></table>";

    if (attachBlock) {
        html += attachBlock;
    }

    var footerAddrLine = (pp.footerAddress || "").trim() || (co.companyAddr || "").trim();
    html +=
        '<footer class="print-footer" role="contentinfo">' +
        (footerAddrLine
            ? '<div class="print-footer-addr"><span class="print-footer-pin" aria-hidden="true">&#128205;</span>' +
              vmEscapeHtml(footerAddrLine) +
              "</div>"
            : "") +
        '<div class="print-footer-strip" aria-hidden="true"></div>' +
        "</footer>";

    html += "</div></body></html>";
    return html;
}

function PrintVendor(code, mode) {
    var c = parseInt(code, 10);
    if (!c) {
        toastr.warning("Invalid vendor.");
        return;
    }
    VendorMasterService.GetSolarVendorMasterByCode(c)
        .then(function (res) {
            var payload = vmParseVendorPrintPayload(res);
            if (!payload || !payload.item) {
                toastr.error("Failed to load vendor for print.");
                return;
            }
            vmResolveIndustryTypeLabelAsync(payload.item).then(function (industryLabel) {
                var html = vmBuildVendorMasterPrintHtml({
                    item: payload.item,
                    cp: payload.cp,
                    bk: payload.bk,
                    attach: { data: payload.attach.data, fileName: payload.attach.fileName },
                    industryTypeLabel: industryLabel
                });
                var win = window.open("", "_blank", "width=920,height=760,scrollbars=yes,resizable=yes");
                if (!win) {
                    toastr.warning("Please allow popups for this site to use print.");
                    return;
                }
                win.document.write(html);
                win.document.close();
                if (mode === "print") {
                    setTimeout(function () {
                        win.focus();
                        win.print();
                    }, 600);
                }
            });
        })
        .catch(function (err) {
            toastr.error("Error loading vendor for print.");
            console.error(err);
        });
}

function PrintVendorFromView(mode) {
    var c = window.G_VendorViewCode;
    if (!c) {
        toastr.warning("Open a vendor view first.");
        return;
    }
    PrintVendor(c, mode);
}

function syncVendorModuleContextFromHeading() {
    var raw = ($("#ERPHeading").text() || "").trim();
    G_ModuleName = raw || "Vendor Master";
    G_IsClientOrVendor = G_ModuleName === "Vendor Master" ? "V" : "C";
}

function extractPartyVerificationBeforeOrderY(res) {
    var row = null;
    if (Array.isArray(res) && res.length > 0) row = res[0];
    else if (res && Array.isArray(res.data) && res.data.length > 0) row = res.data[0];
    else if (res && Array.isArray(res.Data) && res.Data.length > 0) row = res.Data[0];
    else if (res && typeof res === "object" && !Array.isArray(res)) row = res;
    if (!row || typeof row !== "object") return false;
    var v = row.PartyVerificationBeforeOrder;
    if (v === undefined || v === null) v = row.partyVerificationBeforeOrder;
    if (v === undefined || v === null) return false;
    var s = String(v).trim().toUpperCase();
    return s === "Y" || s === "YES" || s === "1";
}

function applyVendorMasterPartyVerificationUi() {
    var show = !!window.G_PartyVerificationBeforeOrderY;
    var $strip = $("#vendorMasterStatsStrip");
    if (!$strip.length) return;
    if (show) {
        $strip.show();
    } else {
        $strip.hide();
        window.G_VendorStatFilter = "all";
    }
}

function shouldShowVendorPartyVerifyColumn() {
    return !!(window.G_PartyVerificationBeforeOrderY && window.G_VendorHasVerifyRight);
}

$(document).ready(function () {
    window.AttachmentControl_onQueueChange = function (count) {
        var badge = document.getElementById("vmTempAttachBadge");
        if (!badge) return;
        badge.textContent = String(count);
        badge.style.display = count > 0 ? "inline-flex" : "none";
        if (typeof vmSyncVendorFormAttachBarState === "function") {
            vmSyncVendorFormAttachBarState(count);
        }
    };

    document.addEventListener("bizsol:attachmentcontrol:changed", function (ev) {
        var d = ev.detail;
        if (!d || d.tempMode) return;
        if (d.masterTableName !== VM_ATTACHMENT_MASTER_TABLE) return;
        if (!document.getElementById("VendorMaster-body")) return;
        if (typeof GetVendorMasterList === "function") GetVendorMasterList();
    });

    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");
    syncVendorModuleContextFromHeading();
    applyVendorMasterClientModeUi();
    window.G_PartyVerificationBeforeOrderY = false;

    VendorMasterService.GetFixedParameterDetails()
        .then(function (res) {
            window.G_PartyVerificationBeforeOrderY = extractPartyVerificationBeforeOrderY(res);
        })
        .catch(function () {
            window.G_PartyVerificationBeforeOrderY = false;
        })
        .finally(function () {
            applyVendorMasterPartyVerificationUi();
            resolveVendorVerifyRight().then(function () {
                GetVendorMasterList();
            });
        });

    GetNationList();
    GetStateList();
    GetCityList();
    GetIndustryTypeMasterList();

    $("#vmBtnModalClose, #vmBtnCancelVendor").on("click", CloseVendorForm);
    $("#vmBtnCancelDelete").on("click", function () {
        $("#vmDeleteConfirmBackdrop").removeClass("show");
    });
    $("#vmBtnCancelVerify").on("click", CloseVendorVerifyModal);

    $("#AccountDesp").on("input", function () {
        var v = ($(this).val() || "").trim();
        if (v) {
            $("#err_AccountDesp").hide();
            $(this).removeClass("vm-input-error");
            $(this).data("vm-had-chars", true);
        } else if ($(this).data("vm-had-chars")) {
            $("#err_AccountDesp").css("display", "flex");
            $(this).addClass("vm-input-error");
        }
        if (G_BillNameSyncedWithVendorName) {
            $("#BillName").val($(this).val());
        }
    });

    $("#BillName").on("input", function () {
        var acc = ($("#AccountDesp").val() || "").trim();
        var bill = ($(this).val() || "").trim();
        if (!bill) {
            G_BillNameSyncedWithVendorName = true;
        } else {
            G_BillNameSyncedWithVendorName = acc === bill;
        }
    });

    $("#GSTNNo").on("input", function () {
        $(this).val($(this).val().toUpperCase());
        resetGSTINValidationCheck();
        var val = $(this).val();
        if (!val) {
            $("#err_GSTNNo").hide();
            $(this).removeClass("vm-input-error");
            $("#PANNo").val("");
        } else {
            validateGST(true);
            if (val.length === 15 && isValidGstinFormat(val)) {
                $("#PANNo").val(val.substring(2, 12));
            }
        }
        updatePanRequiredUi();
    });

    $("#chkGSTINValidation").on("change", async function () {
        if (!this.checked) {
            resetGSTINValidationCheck();
            return;
        }

        var isValid = await validateVendorGSTINStatus(true, true);
        if (!isValid) {
            $(this).prop("checked", false);
        }
    });

    $("#PANNo").on("input", function () {
        $(this).val(($(this).val() || "").toUpperCase().replace(/[^A-Z0-9]/g, ""));
        var gst = ($("#GSTNNo").val() || "").trim();
        if (!gst) {
            validatePAN(true, true);
        } else {
            $("#err_PANNo").hide();
            $("#PANNo").removeClass("vm-input-error");
        }
    });

    $("#PinCode").on("input", function () {
        $(this).val($(this).val().replace(/\D/g, ''));
        var pinVal = $(this).val();
        if (!pinVal) {
            $("#err_PinCode").hide();
            $(this).removeClass("vm-input-error");
        } else if (/^\d{6}$/.test(pinVal)) {
            $("#err_PinCode").hide();
            $(this).removeClass("vm-input-error");
        } else {
            $("#err_PinCode").css("display", "flex");
            $(this).addClass("vm-input-error");
        }
    });

    $("#EMail").on("input", function () {
        validateEmail(true, true);
    });

    $("#PhoneNo").on("input", function () {
        $(this).val($(this).val().replace(/\D/g, ''));
        validatePhone(true, true);
    });

    $("#ContactPersonMobile").on("input", function () {
        $(this).val($(this).val().replace(/\D/g, ''));
        validateCPMobile(true);
    });

    $("#ContactPersonEMail").on("input", function () {
        validateCPEmail(true);
    });

    $("#Nation, #State, #City, #IndustryTypeMaster").on("change", function () {
        var sid = this.id;
        $("#err_" + sid).hide();
        $("#" + sid).removeClass("vm-input-error");
        $("#" + sid).next(".select2-container").removeClass("vm-select-error");
    });

    $("#City").on("change", function () {
        vmVendorApplyAddressFromCity($(this).val());
    });

    $("#Nation").on("change", function () {
        if (G_VendorProgrammaticNationStateCity || G_VendorSuppressCityAddressFill) return;
        $("#City").val("").trigger("change");
        $("#State").val("").trigger("change");
    });

    $("#State").on("change", function () {
        if (G_VendorProgrammaticNationStateCity || G_VendorSuppressCityAddressFill) return;
        $("#City").val("").trigger("change");
    });

    // Summary chips: filter grid by All / Verified / Pending
    $(document).on("click", ".vm-stat-chip[data-vm-filter]", function () {
        var mode = $(this).attr("data-vm-filter");
        window.G_VendorStatFilter = mode;
        if (window.G_VendorMasterSourceRows && window.G_VendorMasterSourceRows.length > 0) {
            refreshVendorMasterGrid();
        }
    });
    $(document).on("keydown", ".vm-stat-chip[data-vm-filter]", function (e) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            $(this).trigger("click");
        }
    });

    // Verified badge: title="" has no reliable hover on touch — tap shows the same details (toastr).
    $(document).on("click", ".vm-verify-status--done[data-vm-verify-info]", function (e) {
        e.preventDefault();
        e.stopPropagation();
        showVendorVerifyDetailFromBadge(this);
    });
    $(document).on("keydown", ".vm-verify-status--done[data-vm-verify-info]", function (e) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            showVendorVerifyDetailFromBadge(this);
        }
    });

    $(window).on("load", function () {
        syncVendorModuleContextFromHeading();
        applyVendorMasterClientModeUi();
    });

    $(document).on("keydown", "#vmIndustryTypeNewName", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            vmSaveNewIndustryType();
        }
    });

    $(document).on("hidden.bs.modal", "#AttachmentControlmodal", function () {
        window.vmVendorAttachmentHighlightCode = 0;
        if (typeof refreshVendorMasterGrid === "function" && (window.G_VendorMasterSourceRows || []).length) {
            refreshVendorMasterGrid();
        }
    });
});

function rowIsVerified(item) {
    var v = item && item.Verified;
    if (v === undefined || v === null) return false;
    if (typeof v === "string") {
        var u = v.toUpperCase();
        return u === "Y" || u === "YES" || v === "1";
    }
    return v === true || v === 1;
}

function escapeVendorAttr(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
/** Resolve verify-by display text from API variants (PascalCase or spaced labels). */
function getVendorVerifiedByDisplay(item) {
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
function getVendorVerifiedOnRaw(item) {
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
function pad2VendorDate(n) {
    return n < 10 ? "0" + n : String(n);
}
/** Verified ON shown as dd/mm/yyyy (local calendar date). */
function formatDateDdMmYyyy(d) {
    if (!(d instanceof Date) || isNaN(d.getTime())) return "";
    return pad2VendorDate(d.getDate()) + "/" + pad2VendorDate(d.getMonth() + 1) + "/" + d.getFullYear();
}
function formatVendorVerifiedOnDisplay(val) {
    if (val === null || val === undefined || val === "") return "";
    if (typeof val === "number" && isFinite(val)) {
        return formatDateDdMmYyyy(new Date(val));
    }
    if (typeof val === "string") {
        var t = val.trim();
        if (!t) return "";
        var parsed = Date.parse(t);
        if (!isNaN(parsed)) return formatDateDdMmYyyy(new Date(parsed));
        return t;
    }
    if (val instanceof Date) return formatDateDdMmYyyy(val);
    return String(val);
}
function showVendorVerifyDetailFromBadge(el) {
    var enc = el.getAttribute("data-vm-verify-info");
    if (!enc) return;
    var txt = decodeURIComponent(enc);
    var oneLine = txt.replace(/\s*\n+\s*/g, " · ");
    if (typeof toastr !== "undefined") {
        toastr.info(oneLine, "Verification", { timeOut: 5500 });
    } else {
        window.alert(txt);
    }
}

/** Verified badge; desktop: title tooltip. Touch/mobile: tap opens toastr (native title is unreliable on touch). */
function buildVerifiedBadgeHtml(item) {
    var by = getVendorVerifiedByDisplay(item);
    var on = formatVendorVerifiedOnDisplay(getVendorVerifiedOnRaw(item));
    var parts = [];
    if (by) parts.push("Verify By: " + by);
    if (on) parts.push("Verified ON: " + on);
    var titleAttr = parts.length ? ' title="' + escapeVendorAttr(parts.join(" · ")) + '"' : "";
    var dataAttr = "";
    var a11y = "";
    var extraClass = "";
    if (parts.length) {
        extraClass = " vm-verify-status--with-detail";
        dataAttr = ' data-vm-verify-info="' + encodeURIComponent(parts.join("\n")) + '"';
        a11y =
            ' role="button" tabindex="0" aria-label="' +
            escapeVendorAttr(parts.join(". ")) +
            '"';
    }
    return (
        '<span class="vm-verify-status vm-verify-status--done' +
        extraClass +
        '"' +
        titleAttr +
        dataAttr +
        a11y +
        ">Verified</span>"
    );
}
function updateVendorMasterStats(rows) {
    var list = Array.isArray(rows) ? rows : [];
    var total = list.length;
    var verified = 0;
    for (var i = 0; i < list.length; i++) {
        if (rowIsVerified(list[i])) verified++;
    }
    var pending = total - verified;
    $("#vmStatTotal").text(total);
    $("#vmStatVerified").text(verified);
    $("#vmStatPending").text(pending);
}

/** Silent check: Verify column if user has Verify right (Vendor Master or Client Master — uses G_ModuleName). */
function resolveVendorVerifyRight() {
    var FinYear = getFinancialYear();
    return MenuService.CheckModuleOptionRight(G_ModuleName, "Verify", "N", FinYear)
        .then(function (response) {
            window.G_VendorHasVerifyRight = response && response.CheckModuleOptionRight === "Y";
        })
        .catch(function () {
            window.G_VendorHasVerifyRight = false;
        });
}

window.G_VendorMasterSourceRows = window.G_VendorMasterSourceRows || [];

window.G_VendorStatFilter = window.G_VendorStatFilter || "all";
/** Vendor row to highlight while attachment modal is open (matches `Code`). */
window.vmVendorAttachmentHighlightCode = window.vmVendorAttachmentHighlightCode || 0;

function vmBizsolMetaKey(k) {
    return typeof k === "string" && k.indexOf("__bizsol") === 0;
}

function vmVendorAttachmentYesFromRaw(raw) {
    if (raw === undefined || raw === null) return false;
    var s = String(raw).trim().toLowerCase();
    return s === "yes" || s === "y" || s === "true" || s === "1";
}

function vmVendorHasAttachmentYesFromItem(item) {
    if (!item || typeof item !== "object") return false;
    var k = vmVendorFindHasAttachmentColumnKey(item);
    return k ? vmVendorAttachmentYesFromRaw(item[k]) : false;
}

/** SHOWDATA row often omits HASATTACHMENT; list grid (`G_VendorMasterSourceRows`) still has it — use for edit footer + sync. */
function vmVendorResolveHasAttachmentYesFromGridList(item) {
    if (!item || typeof item !== "object") return false;
    var code = parseInt(String(item.Code != null ? item.Code : 0), 10);
    if (!code) return false;
    var rows = window.G_VendorMasterSourceRows;
    if (!Array.isArray(rows)) return false;
    var i;
    for (i = 0; i < rows.length; i++) {
        var r = rows[i];
        if (!r || typeof r !== "object") continue;
        var rc = parseInt(String(r.Code != null ? r.Code : 0), 10);
        if (rc !== code) continue;
        return vmVendorHasAttachmentYesFromItem(r);
    }
    return false;
}

/** API list / edit form: HasAttachment Yes (or saved blob / pending queue) → green footer Attachment button */
window.vmVendorFormHasAttachmentYes = window.vmVendorFormHasAttachmentYes || false;

function vmSyncVendorFormAttachBarState(pendingQueueCount) {
    var $btn = $("#vendorDialogBackdrop .vm-btn-attach-bar");
    if (!$btn.length) return;
    var pending =
        pendingQueueCount !== undefined && pendingQueueCount !== null
            ? parseInt(String(pendingQueueCount), 10) || 0
            : parseInt(String(($("#vmTempAttachBadge").text() || "0").trim()), 10) || 0;
    var hasBlob = typeof vmVendorAttachmentHasData === "function" && vmVendorAttachmentHasData(vmVendorExistingImageData);
    var yesList = !!window.vmVendorFormHasAttachmentYes;
    if (yesList || hasBlob || pending > 0) {
        $btn.addClass("vm-btn-attach-bar--yes");
    } else {
        $btn.removeClass("vm-btn-attach-bar--yes");
    }
}

function vmVendorFindHasAttachmentColumnKey(item) {
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
        if (!Object.prototype.hasOwnProperty.call(item, k) || vmBizsolMetaKey(k)) continue;
        var kn = String(k).replace(/\s+/g, "");
        if (/hasattachment/i.test(kn)) return k;
    }
    return null;
}

function vmVendorFormatHasAttachmentDisplayCell(yes, raw) {
    if (yes) return '<span class="vm-has-attachment-yes">Yes</span>';
    var t =
        raw !== undefined && raw !== null && String(raw).trim() !== ""
            ? String(raw).trim()
            : "No";
    return '<span class="vm-has-attachment-no">' + escapeVendorAttr(t) + "</span>";
}

function vmVendorApplyAttachmentGridPatch(row) {
    var item = row || {};
    var attKey = vmVendorFindHasAttachmentColumnKey(item);
    var rawAtt = attKey ? item[attKey] : null;
    var yes = attKey ? vmVendorAttachmentYesFromRaw(rawAtt) : false;
    var classes = [];
    var hl = parseInt(String(window.vmVendorAttachmentHighlightCode || 0), 10) || 0;
    var code = parseInt(String(item.Code != null ? item.Code : 0), 10) || 0;
    if (hl > 0 && code === hl) classes.push("vm-grid-row-attachment-modal-open");
    var patch = { __bizsolRowClass: classes.join(" ") };
    if (attKey) {
        patch[attKey] = vmVendorFormatHasAttachmentDisplayCell(yes, rawAtt);
    }
    return Object.assign({}, item, patch);
}

function filterVendorRowsByStat(rows, mode) {
    var list = Array.isArray(rows) ? rows : [];
    if (!window.G_PartyVerificationBeforeOrderY) return list.slice();
    if (mode === "verified") return list.filter(function (r) { return rowIsVerified(r); });
    if (mode === "pending") return list.filter(function (r) { return !rowIsVerified(r); });
    return list.slice();
}
function mapVendorRowsToGrid(rows) {
    return rows.map(function (item) {
        var verifyCell = "";
        if (shouldShowVendorPartyVerifyColumn()) {
            verifyCell = rowIsVerified(item)
                ? buildVerifiedBadgeHtml(item)
                : '<button type="button" class="vm-btn-verify" onclick="VerifyVendor(' +
                  item.Code +
                  ')"><i class="fas fa-check"></i></button>';
        }

        if (G_IsClientOrVendor === "C") {
            var clientPatch = {};
            if (shouldShowVendorPartyVerifyColumn()) {
                clientPatch.Verify = verifyCell;
            }
            return vmVendorApplyAttachmentGridPatch(Object.assign({}, item, clientPatch));
        }

        var attKeyBtn = vmVendorFindHasAttachmentColumnKey(item);
        var attYesBtn = attKeyBtn ? vmVendorAttachmentYesFromRaw(item[attKeyBtn]) : false;
        var attachBtnClass = attYesBtn ? "vm-btn-attach vm-btn-attach--yes" : "vm-btn-attach";
        var btns =
            '<span class="vm-action-btns">' +
            '<button class="vm-btn-view" title="View" onclick="ViewVendor(' + item.Code + ')">' +
            '<i class="fas fa-eye"></i>' +
            "</button>" +
            '<button class="vm-btn-view" title="Print Preview" onclick="PrintVendor(' +
            item.Code +
            ',\'preview\')">' +
            '<i class="fas fa-search-plus"></i>' +
            "</button>" +
            '<button class="vm-btn-view" title="Print" onclick="PrintVendor(' +
            item.Code +
            ',\'print\')">' +
            '<i class="fas fa-print"></i>' +
            "</button>" +
            '<button type="button" class="' +
            attachBtnClass +
            '" title="Attachment" onclick="openVendorMasterListAttachmentControl(' +
            item.Code +
            "," +
            item.Code +
            ",\'\')\">" +
            '<i class="fas fa-paperclip"></i>' +
            "</button>" +
            '<button class="vm-btn-edit" title="Edit" onclick="EditVendor(' + item.Code + ')">' +
            '<i class="fas fa-pen"></i>' +
            "</button>" +
            '<button class="vm-btn-delete" title="Delete" onclick="ConfirmVendorDelete(' + item.Code + ')">' +
            '<i class="fas fa-trash-can"></i>' +
            "</button>" +
            "</span>";
        var patch = {};
        if (shouldShowVendorPartyVerifyColumn()) {
            patch.Verify = verifyCell;
        }
        patch.Action = btns;
        return vmVendorApplyAttachmentGridPatch(Object.assign({}, item, patch));
    });
}
function applyVendorMasterClientModeUi() {
    var $btn = $("#vmBtnNewVendor");
    if (!$btn.length) return;
    if (G_IsClientOrVendor === "C") {
        $btn.hide();
    } else {
        $btn.show();
    }
}
function getVendorMasterHiddenColumns() {
    var cols = [
        "Code",
        "Short Code",
        "Category",
        "Active",
        "Verified",
        "CityMaster_Code",
        "StateMaster_Code",
        "CountryMaster_Code",
        "VerifiedBy",
        "VerifiedByName",
        "VerifiedByDesp",
        "VerifiedON",
        "VerifiedOn",
        "Verify By",
        "Verified By",
        "Verified ON",
        "Verified On",
        "Address Line 1",
        "Address Line 2",
        "Pin Code",
        "HasAttachment",
        "__bizsolRowClass"
    ];
    if (G_IsClientOrVendor === "C") {
        cols.push("Action");
    }
    if (!window.G_PartyVerificationBeforeOrderY) {
        cols.push("Verify");
    }
    return cols;
}
function getVendorMasterColumnAlignment() {
    var ca = {};
    if (shouldShowVendorPartyVerifyColumn()) {
        ca.Verify = "center;min-width:96px;white-space:nowrap;";
    }
    if (G_IsClientOrVendor === "V") {
        ca.Action =
            "center;min-width:106px;max-width:124px;white-space:normal;vertical-align:middle;";
    }
    /* Must start with a text-align value — Filter.js builds style as text-align:${alignment} */
    ca.SNo = "center;min-width:100px;white-space:nowrap;";
    return ca;
}
function syncVendorStatChipClasses() {
    if (!window.G_PartyVerificationBeforeOrderY) return;
    var mode = window.G_VendorStatFilter || "all";
    $("#vendorMasterStatsStrip .vm-stat-chip[data-vm-filter]")
        .removeClass("vm-stat-chip--active")
        .attr("aria-pressed", "false");
    $('#vendorMasterStatsStrip .vm-stat-chip[data-vm-filter="' + mode + '"]')
        .addClass("vm-stat-chip--active")
        .attr("aria-pressed", "true");
}
function refreshVendorMasterGrid() {
    var source = window.G_VendorMasterSourceRows || [];
    var mode = window.G_VendorStatFilter || "all";
    if (source.length === 0) return;

    var filtered = filterVendorRowsByStat(source, mode);
    var mapped = mapVendorRowsToGrid(filtered);

    const StringFilterColumn = ["Vendor Code","Vendor Name", "Nature", "GSTN No", "Phone", "Email", "City", "State", "Country","Industry Type"];
    const NumericFilterColumn = ["SNo"];
    const DateFilterColumn = [];
    const Button = false;
    const showButtons = [];
    const StringdoubleFilterColumn = [];
    const hiddenColumns = getVendorMasterHiddenColumns();
    const ColumnAlignment = getVendorMasterColumnAlignment();

    if (typeof window.columnFilters === "object" && window.columnFilters !== null) {
        window.columnFilters = {};
    }

    if (mapped.length === 0) {
        window.filteredData_VendorMaster = [];
        window.filteredDataTemp_VendorMaster = [];
        window.currentPage_VendorMaster = 1;
        var colCount = $("#VendorMaster-header th:visible").length;
        if (!colCount) colCount = 1;
        $("#VendorMaster-body").html(
            '<tr><td colspan="' +
                colCount +
                '" style="text-align:center;padding:28px;color:#6b7280;">No data found</td></tr>'
        );
        $("#VendorMaster-header").find("th span.filter-table-heading .fa-filter").remove();
        if (typeof window.updatePageInfo === "function") window.updatePageInfo("VendorMaster");
        if (typeof window.updateButtons === "function") window.updateButtons("VendorMaster");
        if (typeof window.updateFilteredClass === "function") window.updateFilteredClass("VendorMaster-body");
        syncVendorStatChipClasses();
        return;
    }

    BizsolCustomFilterGrid.CreateDataTable(
        "VendorMaster-header",
        "VendorMaster-body",
        mapped,
        Button,
        showButtons,
        StringFilterColumn,
        NumericFilterColumn,
        DateFilterColumn,
        StringdoubleFilterColumn,
        hiddenColumns,
        ColumnAlignment
    );
    syncVendorStatChipClasses();
}
function GetVendorMasterList() {

        VendorMasterService.GetSolarVendorMasterList(G_IsClientOrVendor).then(function (response) {
        var rows = [];
        if (Array.isArray(response)) rows = response;
        else if (Array.isArray(response.data)) rows = response.data;
        else if (Array.isArray(response.Data)) rows = response.Data;

        updateVendorMasterStats(rows);
        window.G_VendorMasterSourceRows = rows;
        window.G_VendorStatFilter = "all";

        if (rows.length > 0) {
            $("#tblVendorMaster").show();
            refreshVendorMasterGrid();
        } else {
            toastr.warning("No vendors found. Add your first vendor!");
            $("#tblVendorMaster").hide();
        }
    }).catch(function () {
        updateVendorMasterStats([]);
        window.G_VendorMasterSourceRows = [];
        toastr.error("Failed to load vendor list.");
    });
}
function OpenNewVendor() {
    var isEdit = G_EditCode > 0;
    var ModuleName = G_ModuleName;
    var OptionName = isEdit ? "Edit" : "New";  
    var ShowMsg = "Y";
    var FinYear = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear)
        .then(function (response) {
            if (!response || response.CheckModuleOptionRight === 'N') {
                toastr.error((response && response.Msg) || "You do not have permission to perform this action.");
                return;
            } else {
                G_EditCode = 0;
                ClearVendorForm();
                $("#vmFormModalTitle").text("Add New Vendor");
                $("#vmBtnSaveText").text("Save Vendor");
                $("#vendorDialogBackdrop").addClass("show");
                setTimeout(function () {
                    vmVendorCodeField().focus();
                }, 140);
            }
        });
   
}
/** Wait until Industry Type options exist, then set value (list loads async). */
function vmSetIndustryTypeMasterFromCode(code) {
    var v = code != null && code !== undefined && String(code) !== "" ? String(code) : "";
    function apply() {
        $("#IndustryTypeMaster").val(v).trigger("change");
    }
    if (!v) {
        apply();
        return;
    }
    function optionExistsForValue(val) {
        return $("#IndustryTypeMaster option").toArray().some(function (o) {
            return String(o.value) === val;
        });
    }
    var n = 0;
    var t = setInterval(function () {
        n++;
        if (optionExistsForValue(v) || n > 50) {
            clearInterval(t);
            apply();
        }
    }, 40);
}

function EditVendor(code) {
    var ModuleName = G_ModuleName,
        OptionName = "Edit",
        ShowMsg = "Y",
        FinYear = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            toastr.error((response && response.Msg) || "Permission denied.");
            return;
        }

        G_EditCode = code;
        ClearVendorForm();
        $("#vmFormModalTitle").text("Edit Vendor");
        $("#vmBtnSaveText").text("Update Vendor");

        VendorMasterService.GetSolarVendorMasterByCode(code).then(function (res) {
            var parsed = vmResolveVendorMasterItemFromApiResponse(res);
            var raw = parsed.raw;
            var item = parsed.item;

            if (!item) {
                toastr.error("Failed to load vendor data.");
                console.warn("EditVendor: Unexpected API response", res);
                return;
            }

            // ── ContactPerson: check multiple possible locations (3rd result set) ────────────
            var cpList = (raw && (raw.AccountContactPersonDetail || raw.accountContactPersonDetail || raw.Table3)) || (Array.isArray(raw) && raw[2]);
            var cp = (Array.isArray(cpList) && cpList.length > 0) ? cpList[0] : null;
            if (!cp && Array.isArray(raw) && raw.length >= 3 && Array.isArray(raw[2])) {
                cp = raw[2][0] || null;  // result set 3 = ContactPerson
            }
            if (cp) {
                $("#ContactPersonName").val(cp.ContactPersonName || "");
                $("#ContactPersonDesignation").val(cp.ContactPersonDesignation || "");
                $("#ContactPersonMobile").val(cp.ContactPersonMobile || "");
                $("#ContactPersonEMail").val(cp.ContactPersonEMail || "");
            }

            // ── BankAccount: check multiple possible locations (2nd result set) ─────────────
            var bkList = (raw && (raw.BankAccountDetail || raw.bankAccountDetail || raw.Table2)) || (Array.isArray(raw) && raw[1]);
            var bk = (Array.isArray(bkList) && bkList.length > 0) ? bkList[0] : null;
            if (!bk && Array.isArray(raw) && raw.length >= 2 && Array.isArray(raw[1])) {
                bk = raw[1][0] || null;  // result set 2 = BankAccount
            }
            if (bk) {
                $("#BankName").val(bk.BankName || bk.bankName || "");
                $("#BankAddress").val(bk.Address || bk.address || "");
                $("#AccountNo").val(bk.AccountNo || bk.accountNo || "");
                $("#IFSCCode").val(bk.IFSCCode || bk.ifscCode || "");
                $("#Refrence").val(bk.Refrence || bk.refrence || "");
            }

            console.log("EditVendor: BankDetail count=" + (bkList ? bkList.length : 0) + ", ContactDetail count=" + (cpList ? cpList.length : 0));

            vmApplyVendorAttachmentFromApi(raw, item);

            // ── VendorMaster fields ──────────────────────────────────
            $("#AccountDesp").val(item.AccountDesp || "");
            $("#BillName").val(item.BillName || "");
            if ((item.AccountDesp || "").trim()) {
                $("#AccountDesp").data("vm-had-chars", true);
            }
            var accTrim = (item.AccountDesp || "").trim();
            var billTrim = (item.BillName || "").trim();
            G_BillNameSyncedWithVendorName = accTrim === billTrim;
            $("#GSTNNo").val(item.GSTNNo || "");
            var gLoad = (item.GSTNNo || "").trim().toUpperCase();
            if (gLoad.length === 15 && isValidGstinFormat(gLoad)) {
                $("#PANNo").val(gLoad.substring(2, 12));
            } else {
                $("#PANNo").val(item.PANNo || "");
            }
            updatePanRequiredUi();
            $("#EMail").val(item.EMail || "");
            $("#PhoneNo").val(item.PhoneNo || "");
            $("#Address1").val(item.Address1 || "");
            $("#Address2").val(item.Address2 || "");
            $("#PinCode").val(item.PinCode || "");
            $("#Nature").val(item.AccountNature || "");
            vmVendorCodeField().val(item.VendorCode != null && item.VendorCode !== undefined ? String(item.VendorCode) : "");
            var industryCode = vmVendorPickFirst(item, [
                "IndustryTypeMaster_Code",
                "industryTypeMaster_Code",
                "IndustryTypeMasterCode"
            ]);
            GetIndustryTypeMasterList(undefined, { vendorIndustryCode: industryCode });

            var stateCode = item.StateMaster_Code != null ? String(item.StateMaster_Code) : "";
            var cityCode = item.CityMaster_Code != null ? String(item.CityMaster_Code) : "";
            var nationCode = item.CountryMaster_Code != null ? String(item.CountryMaster_Code) : "";

            // ── Show modal AFTER data is loaded ──────────────────────────
            $("#vendorDialogBackdrop").addClass("show");
            setTimeout(function () {
                if (typeof vmSyncVendorFormAttachBarState === "function") {
                    vmSyncVendorFormAttachBarState(0);
                }
            }, 0);

            // ── Set dropdowns (Nation → State → City) ────────────────────
            G_VendorSuppressCityAddressFill = true;
            G_VendorProgrammaticNationStateCity = true;
            setTimeout(function () {
                if (nationCode) $("#Nation").val(nationCode).trigger("change");
                setTimeout(function () {
                    if (stateCode) $("#State").val(stateCode).trigger("change");
                    setTimeout(function () {
                        if (cityCode) $("#City").val(cityCode).trigger("change");
                        setTimeout(function () {
                            G_VendorSuppressCityAddressFill = false;
                            G_VendorProgrammaticNationStateCity = false;
                            vmVendorCodeField().focus();
                        }, 120);
                    }, 100);
                }, 100);
            }, 50);
        }).catch(function (err) {
            console.error("EditVendor API error:", err);
            toastr.error("Error loading vendor data. Please try again.");
        });
    }).catch(function (err) {
        console.error("EditVendor permission check error:", err);
        toastr.error("Permission check failed.");
    });
}
function ViewVendor(code) {
    var ModuleName = G_ModuleName,
        OptionName = "View",
        ShowMsg = "Y",
        FinYear = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return;
        }
        else {

            G_ViewCode = code;
            window.G_VendorViewCode = code;

            VendorMasterService.GetSolarVendorMasterByCode(code).then(function (res) {
                var parsed = vmResolveVendorMasterItemFromApiResponse(res);
                var raw = parsed.raw;
                var item = parsed.item;
                if (!item) {
                    toastr.error("Failed to load vendor details.");
                    return;
                }

                // Header
                $("#viewVendorName").text(item.AccountDesp || "—");

                // Badges
                if (item.City) {
                    $("#viewCityBadge").html('<i class="fas fa-city" style="margin-right:5px;font-size:10px;"></i>' + item.City).show();
                } else {
                    $("#viewCityBadge").hide();
                }
                if (item.GSTNNo) {
                    $("#viewGSTBadge").html('<i class="fas fa-receipt" style="margin-right:5px;font-size:10px;"></i>' + item.GSTNNo).show();
                } else {
                    $("#viewGSTBadge").hide();
                }

                // Fields
                $("#vf_VendorName").text(item.AccountDesp || "—");
                $("#vf_DisplayName").text(item.BillName || "—");
                $("#vf_VendorCode").text(item.VendorCode != null && item.VendorCode !== "" ? String(item.VendorCode) : "—");
                vmFillViewIndustryType(item);
                $("#vf_Address1").text(item.Address1 || "—");
                $("#vf_Address2").text(item.Address2 || "—");
                $("#vf_Pincode").text(item.PinCode || "—");
                $("#vf_GSTNo").text(item.GSTNNo || "—");
                var panView = item.PANNo || "";
                if (!panView && item.GSTNNo) {
                    var gV = (item.GSTNNo || "").trim().toUpperCase();
                    if (gV.length === 15 && isValidGstinFormat(gV)) {
                        panView = gV.substring(2, 12);
                    }
                }
                $("#vf_PANNo").text(panView || "—");
                $("#vf_EMail").text(item.EMail || "—");
                $("#vf_PhoneNo").text(item.PhoneNo || "—");
                $("#vf_State").text(item.State || "—");
                $("#vf_City").text(item.City || "—");
                $("#vf_Nation").text(item.Nation || "—");

                // Contact Person (3rd result set)
                var cpList = raw.AccountContactPersonDetail || raw.accountContactPersonDetail || raw.Table3 || raw[2];
                var cp = (Array.isArray(cpList) && cpList.length > 0) ? cpList[0] : null;
                $("#vf_ContactPersonName").text(cp && cp.ContactPersonName ? cp.ContactPersonName : "—");
                $("#vf_ContactPersonDesignation").text(cp && cp.ContactPersonDesignation ? cp.ContactPersonDesignation : "—");
                $("#vf_ContactPersonMobile").text(cp && cp.ContactPersonMobile ? cp.ContactPersonMobile : "—");
                $("#vf_ContactPersonEMail").text(cp && cp.ContactPersonEMail ? cp.ContactPersonEMail : "—");

                // Bank Details (2nd result set)
                var bkList = raw.BankAccountDetail || raw.bankAccountDetail || raw.Table2 || raw[1];
                var bk = (Array.isArray(bkList) && bkList.length > 0) ? bkList[0] : null;
                $("#vf_BankName").text(bk && (bk.BankName || bk.bankName) ? (bk.BankName || bk.bankName) : "—");
                $("#vf_BankAddress").text(bk && (bk.Address || bk.address) ? (bk.Address || bk.address) : "—");
                $("#vf_AccountNo").text(bk && (bk.AccountNo || bk.accountNo) ? (bk.AccountNo || bk.accountNo) : "—");
                $("#vf_IFSCCode").text(bk && (bk.IFSCCode || bk.ifscCode) ? (bk.IFSCCode || bk.ifscCode) : "—");

                var vAtt = vmParseVendorAttachmentFromApiResponse(raw, item);
                G_VendorViewAttachData = vAtt.data;
                G_VendorViewAttachFileName = vAtt.fileName;
                if (vmVendorAttachmentHasData(G_VendorViewAttachData)) {
                    $("#vmViewAttachRow").show();
                    $("#vf_AttachmentName").text(G_VendorViewAttachFileName || "File");
                } else {
                    $("#vmViewAttachRow").hide();
                }

                //$('#State').select2({
                //    width: '-webkit-fill-available'
                //});
                //$('#Nation').select2({
                //    width: '-webkit-fill-available'
                //});
                //$('#City').select2({
                //    width: '-webkit-fill-available'
                //});

                $("#viewVendorBackdrop").addClass("show");
            }).catch(function () {
                toastr.error("Error loading vendor details. Please try again.");
            });

        }
    });
}

function VerifyVendor(code) {
    if (!window.G_PartyVerificationBeforeOrderY) {
        toastr.warning("Party verification is not enabled in fixed parameters.");
        return;
    }
    if (!window.G_VendorHasVerifyRight) {
        toastr.warning("You do not have Verify permission.");
        return;
    }
    G_VendorVerifyCode = code;
    var isClient = G_IsClientOrVendor === "C";
    var noun = isClient ? "client" : "vendor";
    $("#vmVerifyConfirmTitle").text("Verify this " + noun + "?");
    $("#vmVerifyConfirmText").text("This will mark the " + noun + " as verified.");
    $("#vmVerifyConfirmBackdrop").addClass("show");
}

function CloseVendorVerifyModal() {
    G_VendorVerifyCode = 0;
    $("#vmVerifyConfirmBackdrop").removeClass("show");
}

function DoVendorVerify() {
    var code = G_VendorVerifyCode;
    if (!code) {
        CloseVendorVerifyModal();
        return;
    }
    if (!window.G_PartyVerificationBeforeOrderY) {
        toastr.warning("Party verification is not enabled in fixed parameters.");
        CloseVendorVerifyModal();
        return;
    }
    var ModuleName = G_ModuleName,
        OptionName = "Verify",
        ShowMsg = "Y",
        FinYear = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight === "N") {
            toastr.error(response.Msg);
            CloseVendorVerifyModal();
            return;
        }
        VendorMasterService.VerifySolarVendorMaster(code)
            .then(function (res) {
                var ok = res && (res.Status === "Y" || res.status === "Y");
                if (ok) {
                    CloseVendorVerifyModal();
                    toastr.success(res.Msg || "Verified successfully.");
                    GetVendorMasterList();
                } else {
                    toastr.error((res && (res.Msg || res.message)) || "Verify failed.");
                }
            })
            .catch(function () {
                toastr.error("Verify failed. Please try again.");
            });
    }).catch(function (err) {
        console.error("DoVendorVerify permission check error:", err);
        toastr.error("Permission check failed.");
        CloseVendorVerifyModal();
    });
}

function CloseVendorViewModal() {
    G_ViewCode = 0;
    window.G_VendorViewCode = 0;
    $("#viewVendorBackdrop").removeClass("show");
}
function EditFromVendorView() {
    var codeToEdit = G_ViewCode;
    CloseVendorViewModal();
    EditVendor(codeToEdit);
}
function ConfirmVendorDelete(code) {
    G_EditCode = code;
    $("#vmReasonForDeleteInput").val("");
    $("#vmDeleteConfirmBackdrop").addClass("show");
    setTimeout(function () { $("#vmReasonForDeleteInput").focus(); }, 150);
}
function DoVendorDelete() {
    var ModuleName = G_ModuleName,
        OptionName = "Delete",
        ShowMsg = "Y",
        FinYear = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return;
        } else {
            var reason = $("#vmReasonForDeleteInput").val();
            if (!reason) {
                toastr.warning("Please provide a reason for deletion.");
                $("#vmReasonForDeleteInput").focus();
                return;
            }
            VendorMasterService.DeleteSolarVendorMaster(G_EditCode, reason).then(function (res) {
                $("#vmDeleteConfirmBackdrop").removeClass("show");
                if (res && res.Status === 'Y') {
                    var delPk = parseInt(String(G_EditCode || 0), 10) || 0;
                    if (delPk > 0) {
                        AttachmentControlService.DeleteAllAttachment(VM_ATTACHMENT_MASTER_TABLE, delPk, "", 0).catch(function (e) {
                            console.warn("Delete all attachments after vendor delete", e);
                        });
                    }
                    GetVendorMasterList();
                    ShowVendorSuccessModal(
                        "Deleted Successfully!",
                        res.Msg || "The vendor record has been permanently removed.",
                        "fa-trash-can"
                    );
                } else {
                    toastr.error((res && res.Msg) || "Failed to delete vendor.");
                }
            }).catch(function () {
                toastr.error("Failed to delete vendor. Please try again.");
                $("#vmDeleteConfirmBackdrop").removeClass("show");
            });
        }

    });
}

/** Map API / model validation text to short user-facing messages (save errors). */
function InitAttachmentControl(masterTableName, masterTableCode, detailTableName, detailTableCode, entryNo, entryDate, mode, sourceDownloadFileName) {
    var url = (sessionStorage.getItem("AppBaseURL") || "") + "/CustomControl/AttachmentControl";
    if (typeof jQuery !== "undefined") {
        jQuery("#VendorMaster_AttachmentControlmodal").load(url, {
            MasterTableName: masterTableName,
            MasterTableCode: masterTableCode,
            DetailTableName: detailTableName,
            DetailTableCode: detailTableCode,
            EntryNo: entryNo,
            EntryDate: entryDate,
            Mode: mode,
            SourceDownloadFileName: sourceDownloadFileName || ""
        });
    }
}

function openVendorMasterAttachmentControl() {
    var masterCode = parseInt(String(G_EditCode || 0), 10) || 0;
    window.vmVendorAttachmentHighlightCode = masterCode > 0 ? masterCode : 0;
    if (typeof refreshVendorMasterGrid === "function" && (window.G_VendorMasterSourceRows || []).length) {
        refreshVendorMasterGrid();
    }
    var entryNo = masterCode;
    var entryDate = new Date().toISOString().split("T")[0];
    InitAttachmentControl(VM_ATTACHMENT_MASTER_TABLE, masterCode, "", 0, entryNo, entryDate, "all", "");
}

function openVendorMasterListAttachmentControl(code, entryNo, entryDate) {
    var masterCode = parseInt(code, 10) || 0;
    if (masterCode <= 0) {
        toastr.warning("Invalid record. Cannot open attachments.");
        return;
    }
    window.vmVendorAttachmentHighlightCode = masterCode;
    if (typeof refreshVendorMasterGrid === "function" && (window.G_VendorMasterSourceRows || []).length) {
        refreshVendorMasterGrid();
    }
    var en = parseInt(entryNo, 10) || 0;
    if (en <= 0) en = masterCode;
    InitAttachmentControl(VM_ATTACHMENT_MASTER_TABLE, masterCode, "", 0, en, entryDate || "", "all", "");
}

function friendlyValidationLine(fieldKey, apiMsg) {
    var k = fieldKey || '';
    var m = (apiMsg || '').toLowerCase();
    if (k.indexOf('CountryMaster_Code') >= 0 || m.indexOf('countrymaster_code') >= 0)
        return 'Please select Nation / Country.';
    if (k.indexOf('StateMaster_Code') >= 0 || m.indexOf('statemaster_code') >= 0)
        return 'Please select State.';
    if (k.indexOf('CityMaster_Code') >= 0 || m.indexOf('citymaster_code') >= 0)
        return 'Please select City.';
    if (k === 'VendorMaster' || m.indexOf('vendormaster field is required') >= 0)
        return 'Please fill all required fields (vendor code, name, email, phone, country, state, city) and save again.';
    // Avoid false positives: any API text containing "VendorCode" (e.g. validation on other fields) used to map here.
    if (
        m.indexOf("vendor code is required") >= 0 ||
        (m.indexOf("vendorcode") >= 0 && m.indexOf("required") >= 0) ||
        (m.indexOf("vendor code") >= 0 && m.indexOf("required") >= 0)
    ) {
        return "Vendor Code is required.";
    }
    if (k.indexOf("VendorCode") >= 0 && m.indexOf("required") >= 0) return "Vendor Code is required.";
    return apiMsg;
}

function SaveVendor() {
    var isEdit = G_EditCode > 0;
    var ModuleName = G_ModuleName;
    var OptionName = isEdit ? "Edit" : "New";   // ✔ correct option per mode
    var ShowMsg = "Y";
    var FinYear = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            toastr.error((response && response.Msg) || "You do not have permission to perform this action.");
            return;
        } else {
            if (!ValidateVendorForm()) return;

            var payload = BuildVendorPayload();
            var btnSave = $("#vmBtnSaveVendor");
            var origLabel = $("#vmBtnSaveText").text();

            btnSave.prop("disabled", true);
            $("#vmBtnSaveText").text(isEdit ? "Updating…" : "Saving…");

            VendorMasterService.SaveVendorMaster(payload).then(async function (res) {
                if (res && res.Status === 'Y') {
                    var savedPk =
                        parseInt(
                            res.Code ??
                                res.code ??
                                (res.Data && (res.Data.Code ?? res.Data.code)) ??
                                (res.data && (res.data.Code ?? res.data.code)) ??
                                (isEdit ? G_EditCode : 0),
                            10
                        ) || 0;
                    var entryDateStr = new Date().toISOString().split("T")[0];
                    if (savedPk > 0 && typeof window.FlushPendingAttachments === "function") {
                        var flush = await window.FlushPendingAttachments(
                            savedPk,
                            VM_ATTACHMENT_MASTER_TABLE,
                            savedPk,
                            entryDateStr
                        );
                        if (flush && flush.failed > 0) {
                            toastr.warning(
                                (flush.uploaded || 0) +
                                    " attachment(s) uploaded, " +
                                    flush.failed +
                                    " failed."
                            );
                        } else if (flush && flush.uploaded > 0) {
                            toastr.success(
                                (flush.uploaded || 0) + " pending attachment(s) uploaded."
                            );
                        }
                    }
                    CloseVendorForm();
                    GetVendorMasterList();
                    ShowVendorSuccessModal(
                        isEdit ? "Updated Successfully!" : "Saved Successfully!",
                        res.Msg || (isEdit ? "Vendor details have been updated." : "New vendor has been added."),
                        isEdit ? "fa-pen-to-square" : "fa-circle-check"
                    );
                } else {
                    var rawSaveMsg = (res && res.Msg) || "";
                    var fallbackSave = isEdit ? "Failed to update vendor." : "Failed to save vendor.";
                    var friendlySave = friendlyValidationLine("", rawSaveMsg);
                    toastr.error(friendlySave || fallbackSave);
                }
            })
                .catch(function (err) {
                    console.error("SaveVendorMaster error:", err);
                    // Friendly / technical message already shown by promiseAjaxCallApi (toastr)
                })
                .finally(function () {
                    btnSave.prop("disabled", false);
                    $("#vmBtnSaveText").text(origLabel);
                });
            }
        }).catch(function (err) {
            console.error("CheckModuleOptionRight error:", err);
            toastr.error("Permission check failed. Please refresh and try again.");
        });
}

/** Select2 / dropdown master codes — API expects int32, never null or "". */
function vmDropdownMasterCode(selectId) {
    var raw = $("#" + selectId).val();
    var n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
}

function BuildVendorPayload() {
    var vendorCode = parseInt(G_EditCode) || 0;

    return {
        VendorMaster: [
            {
                // ── Primary Key ──────────────────────────────────────────
                Code: vendorCode,

                // ── Form Fields (from VendorMaster.cshtml) ───────────────
                AccountDesp: $("#AccountDesp").val(),
                BillName: $("#BillName").val(),
                GSTNNo: $("#GSTNNo").val(),
                EMail: $("#EMail").val(),
                PhoneNo: $("#PhoneNo").val(),
                City: $("#City option:selected").text(),
                State: $("#State option:selected").text(),
                Nation: $("#Nation option:selected").text(),
                PinCode: $("#PinCode").val(),
                AccountNature: $("#Nature").val(),

                // ── Default Values (not in form) ─────────────────────────
                Address1: $("#Address1").val(),
                Address2: $("#Address2").val(), 
                Zone: "",
                DespWithoutSpaces: "",
                FaxNo: "",
                WebSite: "",
                CSTNo: "",
                STNo: "",
                ECCNo: "",
                RangeDivision: "",
                VatNo: "",
                ServiceTaxNo: "",
                PANNo: (function () {
                    var g = ($("#GSTNNo").val() || "").trim().toUpperCase();
                    if (g && isValidGstinFormat(g)) {
                        return g.substring(2, 12);
                    }
                    return ($("#PANNo").val() || "").trim().toUpperCase();
                })(),
                TANNo: "",
                AadhaarNo: "",
                EXIMCode: "",
                DrugLicenseNoAnddate: "",
                MSMEType: "",
                MSMENo: "",
                Client: "N",
                Vendor: "Y",
                JobWorker: "N",
                Transporter: "N",
                Contractor: "N",
                Investor: "N",
                IsAgent: "N",
                IsProspectiveCustomer: "N",
                AccountType: "",
                AccountCategory: "",
                AccountShortCode: "",
                AccountNameForIT: "",
                AccountNo: "",
                BankActID: "",
                TransferClosingBalance: "Y",
                MasterAccountCode: 0,
                CodeinFactoryDB: 0,
                MaintainBillWise: "N",
                MaintainInForeignCurrency: "N",
                OpeningSource: "C",
                LedgerSorting: "",
                AccountMasterHistory: "",
                LedgerGroupMISMaster_Code: 0,
                AccountPrintInCommInvoice: "",
                DepreciationRateCompanyAct: 0,
                DepreciationRateIncomeTaxAct: 0,
                BankMaster_Code: 0,
                DefaultBankMaster_Code: 0,
                F_BankChequeTypeMaster_Code: 0,
                F_BankRTGSMaster_Code: 0,
                CreditLimit: 0,
                TDSApplicable: "N",
                TDSProvisionsAs: "Basic",
                TCSApplicable: "N",
                TCSRate: 0,
                GSTApplicableDate: null,
                IsSEZSupply: "N",
                GSTRFrequency: "Q",
                IsUnRegisterGSTNo: "N",
                PartyExcemptionNo: "",
                DivisionMaster_Code: 0,
                SubDivisionMaster_Code: 0,
                BranchMaster_Code: 0,
                AccountCodeinBranch: 0,
                BranchCode: "",
                GroupNo: 0,
                GroupTypeMaster_Code: 0,
                CostCentreCategoryMaster_Code: 0,
                CostCenterMendatory: "N",
                AccountMaster_Code_MasterGroup: 0,
                AccountMaster_CodeDebitCredit: 0,
                AccountMaster_CodeScheme: 0,
                ServiceProviderNatureMaster_Code: 0,
                ServiceProviderMaster_Code: 0,
                MRNWithoutPO: "",

                // ── Audit ────────────────────────────────────────────────
                UserID: G_UserMasterCode,
                CreateDate: null,
                UpdateDate: null,
                FinYear: getFinancialYear(),
                UpdatedBy: G_UserMasterCode,
                DatabaseLocation_Code: null,
                ZoneMaster_Code: 0,
                AreaMaster_Code: 0,
                Verified: "N",
                VerifiedBy: 0,
                VerifiedON: null,
                CountryMaster_Code: vmDropdownMasterCode("Nation"),
                StateMaster_Code: vmDropdownMasterCode("State"),
                CityMaster_Code: vmDropdownMasterCode("City"),
                CityMaster_CodeFreight: 0,
                DistributorMaster_Code: 0,
                SalesAccountCode: 0,
                PriceListTypeMaster_Code: 0,
                DiscountGroupMaster_Code: 0,
                SpecialDiscountPercent: 0,
                FreightDiscountPercent: 0,
                VendorCode: (vmVendorCodeField().val() || "").trim(),
                PreferredTransport: "",
                RoadPermitApplicable: "N",
                Distance: 0,
                AllowOnlyFreightAccountProvisionInInvoice: "N",
                IndustryTypeMaster_Code: vmDropdownMasterCode("IndustryTypeMaster"),
                F_CommonValues_Priority_Code: 0,
                F_CommonValues_Code_Grade: 0,
                EmailInvoiceCopy: "N",
                LanguageMaster_Code: 0,
                CurrencyMaster_Code: 0,
                ClientPassword: "",
                F_Common_ClientVendor_Code_Status: 0,
                F_Common_ClientVendor_Code_PaymentTerms: 0,
                F_Common_ClientVendor_Code_PaymentMode: 0,
                Access: "",
                CustomerSource: "",
                NameofExhibition: "",
                PortOfDischarge: "",
                YearofExhibition: "",
                PortOfLoiding: "",
                CMSCode: "",
                AirlineMaster_Code_Prefered: 0,
                AirlineMaster_Code_Optional: 0,
                FreightForwarderMaster_Code: 0,
                CommissionAgent: "",
                ShowDlvryAddasByrAndCons: "N",
                AllowInvoiceWOPackingList: "Y",
                LinkedAccountMaster_Code: 0,
                BudgetApplicable: "N",
                BudgetPeriod: "",
                Marka: "",
                IsActive: "Y",
                IsActiveMobileApp: "Y",
                CostCenterMandatory: "N",
                BillDetailApplicableInGRBill: "N",
                OutSideLocalArea: "N",
                ForDomesticUseOnly: "N",
                RateDetailApplicable: "N",
                RemarksDSP: "",
                PPCPersonMaster_Code: 0,
                DealerSince: "",
                CityType: "",
                FileNo: "",
                SortCodePreFix: "",
                ABCCode: "",
                TransactionType: "",
                Ratings: "",
                InsuranceChargesApplicable: "N",
                LastCalsulateOnCD: null,
                MonthlyGovermentDues: "N",
                DueDaysForGovermentDues: 0,
                ReminderDaysForGovermentDues: 0,
                InterestRateValue: 0,
                RelationWithCustomer: "",
                RelativeName: "",
                WitnessName1: "",
                RelationWithWitness1: "",
                RelativeNameWitness1: "",
                WitnessAddress1: "",
                WitnessName2: "",
                RelationWithWitness2: "",
                RelativeNameWitness2: "",
                WitnessAddress2: "",
                CRNNo_ByThirdParty: "",
                ACNo_ByThirdParty: "",
                TransNo_ByThirdParty: "",
                OtherStatus: "",
                AttachFileName: "",
                AttachData: [],
                UserMasterCode: G_UserMasterCode
            }
        ],

        // ── Contact Person Detail (Code is IDENTITY - do not send) ─────
        AccountContactPersonDetail: [
            {
                AccountMaster_Code: vendorCode,
                ContactPersonName: $("#ContactPersonName").val(),
                ContactPersonDesignation: $("#ContactPersonDesignation").val(),
                ContactPersonExt: "",
                ContactPersonMobile: $("#ContactPersonMobile").val(),
                ContactPersonEMail: $("#ContactPersonEMail").val(),
                ContactPersonSkypeId: "",
                CountryCode: "91",
                DOB: null,
                DOA: null,
                Default: "N",
                DepartmentMaster_Code: 0
            }
        ],

        // ── Bank Account Detail (Code is IDENTITY - do not send) ───────
        BankAccountDetail: [
            {
                AccountMaster_Code: vendorCode,
                BankName: $("#BankName").val(),
                Address: $("#BankAddress").val(),
                AccountNo: $("#AccountNo").val(),
                IFSCCode: $("#IFSCCode").val(),
                BeneficiaryCode: "",
                SWIFTCode: "",
                Refrence: $("#Refrence").val(),
                Default: "N",
                Verified: "N",
                VerifiedBy: 0,
                VerifiedOn: null
            }
        ],
    };
}
function ValidateVendorForm() {
    var valid = true;

    // Vendor Code — required
    var vcEl = vmVendorCodeField();
    var vcErr = $("#err_VendorCode");
    var vcVal = (vcEl.val() || "").trim();
    if (!vcVal) {
        vcErr.css("display", "flex");
        vcEl.addClass("vm-input-error");
        vcEl.focus();
        valid = false;
        console.warn("Validation failed: VendorCode is empty");
    } else {
        vcErr.hide();
        vcEl.removeClass("vm-input-error");
    }

    // Vendor Name — required
    var nameEl = $("#AccountDesp");
    var nameErr = $("#err_AccountDesp");
    if (!nameEl.val()) {
        nameErr.css("display", "flex");
        nameEl.addClass("vm-input-error");
        if (vcVal) nameEl.focus();
        valid = false;
        console.warn("Validation failed: AccountDesp is empty");
    } else {
        nameErr.hide();
        nameEl.removeClass("vm-input-error");
    }

    // Pincode — optional but if filled must be 6 digits
    var pinVal = $("#PinCode").val();
    if (pinVal && !/^\d{6}$/.test(pinVal)) {
        $("#err_PinCode").css("display", "flex");
        $("#PinCode").addClass("vm-input-error");
        valid = false;
        console.warn("Validation failed: PinCode invalid:", pinVal);
    } else {
        $("#err_PinCode").hide();
        $("#PinCode").removeClass("vm-input-error");
    }

    if (!vmValidateRequiredSelect("Nation")) {
        valid = false;
        console.warn("Validation failed: Nation");
    }
    if (!vmValidateRequiredSelect("City")) {
        valid = false;
        console.warn("Validation failed: City");
    }
    if (!vmValidateRequiredSelect("State")) {
        valid = false;
        console.warn("Validation failed: State");
    }

    if (!validateGST(true))      { valid = false; console.warn("Validation failed: GSTNNo"); }
    if (!validatePAN(true))      { valid = false; console.warn("Validation failed: PANNo"); }
    if (!validateEmail(true))    { valid = false; console.warn("Validation failed: EMail"); }
    if (!validatePhone(true))    { valid = false; console.warn("Validation failed: PhoneNo"); }
    if (!validateCPMobile(true)) { valid = false; console.warn("Validation failed: ContactPersonMobile"); }
    if (!validateCPEmail(true))  { valid = false; console.warn("Validation failed: ContactPersonEMail"); }

    console.log("ValidateVendorForm result:", valid);
    return valid;
}

/** Nation / City / State dropdowns — placeholder option value "". */
function vmValidateRequiredSelect(selectId) {
    var $s = $("#" + selectId);
    var v = $s.val();
    var ok = v !== undefined && v !== null && String(v).trim() !== "";
    var $c = $s.next(".select2-container");
    if (!ok) {
        $("#err_" + selectId).css("display", "flex");
        $s.addClass("vm-input-error");
        if ($c.length) $c.addClass("vm-select-error");
        return false;
    }
    $("#err_" + selectId).hide();
    $s.removeClass("vm-input-error");
    if ($c.length) $c.removeClass("vm-select-error");
    return true;
}
/** Valid 15-character Indian GSTIN format (PAN is embedded at positions 3–12). */
function isValidGstinFormat(gstVal) {
    if (!gstVal) return false;
    var gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstPattern.test(gstVal);
}
/** Show * on PAN label only when GST is empty (PAN mandatory then). */
function updatePanRequiredUi() {
    var gst = ($("#GSTNNo").val() || "").trim();
    var $m = $("#vm_pan_required_mark");
    if ($m.length) {
        if (gst) {
            $m.hide();
        } else {
            $m.show();
        }
    }
}
/** When GST is empty, PAN is required and must match standard PAN format. */
function validatePAN(showError, treatEmptyAsOk) {
    var gst = ($("#GSTNNo").val() || "").trim().toUpperCase();
    var pan = ($("#PANNo").val() || "").trim().toUpperCase();
    if (gst) {
        $("#err_PANNo").hide();
        $("#PANNo").removeClass("vm-input-error");
        return true;
    }
    if (!pan) {
        if (showError && !treatEmptyAsOk) {
            $("#err_PANNo").css("display", "flex");
            $("#PANNo").addClass("vm-input-error");
        }
        return treatEmptyAsOk ? true : false;
    }
    var panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panPattern.test(pan)) {
        if (showError) {
            $("#err_PANNo").css("display", "flex");
            $("#PANNo").addClass("vm-input-error");
        }
        return false;
    }
    $("#err_PANNo").hide();
    $("#PANNo").removeClass("vm-input-error");
    return true;
}
function validateGST(showError) {
    var gstVal = $("#GSTNNo").val();
    if (!gstVal) {
        $("#err_GSTNNo").hide();
        $("#GSTNNo").removeClass("vm-input-error");
        return true;
    }
    if (!isValidGstinFormat(gstVal)) {
        if (showError) {
            $("#err_GSTNNo").css("display", "flex");
            $("#GSTNNo").addClass("vm-input-error");
        }
        return false;
    }
    $("#err_GSTNNo").hide();
    $("#GSTNNo").removeClass("vm-input-error");
    return true;
}

function resetGSTINValidationCheck() {
    G_GSTINValidatedNo = "";
    $("#chkGSTINValidation").prop("checked", false);
    setGSTINValidationStatus("", "");
}

function setGSTINValidationStatus(message, statusClass) {
    $("#spGSTINValidationStatus")
        .removeClass("is-success is-error")
        .addClass(statusClass || "")
        .text(message || "");
}

function getGSTINFromStatusResponse(statusResponse, fallbackGSTIN) {
    if (!statusResponse) return fallbackGSTIN;

    var details = statusResponse.EWBDetails || statusResponse.ewbDetails || {};
    return (
        details.gstin ||
        details.GSTIN ||
        statusResponse.GSTIN ||
        statusResponse.GSTNNo ||
        statusResponse.GSTNo ||
        statusResponse.gstin ||
        statusResponse.gstnNo ||
        statusResponse.gstNo ||
        fallbackGSTIN
    );
}

function getGSTINStatusModel(response, fallbackGSTIN) {
    var row = Array.isArray(response) ? response[0] : response;
    if (!row) throw "GSTIN validation response not found.";

    var isSuccess =
        row.IsSuccess === true ||
        String(row.IsSuccess || row.isSuccess || "").toLowerCase() === "true" ||
        String(row.Status || row.status || "").toUpperCase() === "Y";

    if (!isSuccess) {
        throw row.ErrorMessage || row.errorMessage || row.ErrorCode || "GSTIN validation failed.";
    }

    var details = row.EWBDetails || row.ewbDetails;
    if (!details) throw "GSTIN details not found in response.";

    var gstin = details.gstin || details.GSTIN || row.GSTIN || fallbackGSTIN;
    if (!isValidGstinFormat(String(gstin || "").toUpperCase())) {
        throw "Invalid GSTIN response format.";
    }

    return {
        gstin: String(gstin).toUpperCase(),
        tradeName: details.tradeName || details.TradeName || "",
        legalName: details.legalName || details.LegalName || "",
        address1: details.address1 || details.Address1 || "",
        address2: details.address2 || details.Address2 || "",
        stateCode: details.stateCode || details.StateCode || "",
        pinCode: details.pinCode || details.PinCode || "",
        txpType: details.txpType || details.TxpType || "",
        status: details.status || details.Status || "",
        blkStatus: details.blkStatus || details.BlkStatus || "",
        resstatus: details.resstatus || details.ResStatus || "",
        errorCodes: details.errorCodes || details.ErrorCodes || "",
        errorDesc: details.errorDesc || details.ErrorDesc || "",
        raw: row
    };
}

function ensureGSTINDetailsModal() {
    if ($("#vmGSTINDetailsBackdrop").length) return;

    $("body").append(
        '<div id="vmGSTINDetailsBackdrop" class="vm-backdrop">' +
            '<div class="vm-modal" style="max-width:760px;">' +
                '<div class="vm-modal-header">' +
                    '<div class="vm-modal-title"><i class="fas fa-receipt"></i><span>GSTIN Details</span></div>' +
                    '<button type="button" class="vm-modal-close" id="vmGSTINDetailsClose" title="Close"><i class="fas fa-times"></i></button>' +
                '</div>' +
                '<div class="vm-modal-body">' +
                    '<div id="vmGSTINDetailsContent" class="vm-form-grid"></div>' +
                '</div>' +
                '<div class="vm-modal-footer" style="justify-content:flex-end;">' +
                    '<button type="button" class="vm-btn-cancel" id="vmGSTINDetailsOk"><i class="fas fa-check"></i> OK</button>' +
                '</div>' +
            '</div>' +
        '</div>'
    );

    $("#vmGSTINDetailsClose, #vmGSTINDetailsOk").on("click", function () {
        $("#vmGSTINDetailsBackdrop").removeClass("show");
    });
}

function gstDetailField(label, value) {
    return (
        '<div class="vm-form-group">' +
            '<label>' + vmEscapeHtml(label) + '</label>' +
            '<input type="text" class="vm-input" readonly value="' + vmEscapeHtml(value || "") + '" />' +
        '</div>'
    );
}

function showGSTINStatusModal(model) {
    ensureGSTINDetailsModal();

    var html = "";
    html += gstDetailField("GSTIN", model.gstin);
    html += gstDetailField("Trade Name", model.tradeName);
    html += gstDetailField("Legal Name", model.legalName);
    html += gstDetailField("Address 1", model.address1);
    html += gstDetailField("Address 2", model.address2);
    html += gstDetailField("State Code", model.stateCode);
    html += gstDetailField("Pin Code", model.pinCode);
    html += gstDetailField("Taxpayer Type", model.txpType);
    html += gstDetailField("Status", model.status);
    html += gstDetailField("Block Status", model.blkStatus);
    html += gstDetailField("Response Status", model.resstatus);
    if (model.errorCodes || model.errorDesc) {
        html += gstDetailField("Error Codes", model.errorCodes);
        html += gstDetailField("Error Description", model.errorDesc);
    }

    $("#vmGSTINDetailsContent").html(html);
    $("#vmGSTINDetailsBackdrop").addClass("show");
}

function bindGSTINAddressToVendorForm(model) {
    var vendorName = (model.tradeName || model.legalName || "").trim();
    if (vendorName) {
        $("#AccountDesp").val(vendorName);
        $("#AccountDesp").data("vm-had-chars", true);
        $("#err_AccountDesp").hide();
        $("#AccountDesp").removeClass("vm-input-error");
        if (G_BillNameSyncedWithVendorName) {
            $("#BillName").val(vendorName);
        }
    }
    $("#Address1").val(model.address1 || "");
    $("#Address2").val(model.address2 || "");
    $("#PinCode").val(model.pinCode || "");
}

async function validateVendorGSTINStatus(showError, requireGST) {
    var gstVal = ($("#GSTNNo").val() || "").trim().toUpperCase();

    if (!gstVal) {
        if (requireGST) {
            $("#err_GSTNNo").html('<i class="fas fa-circle-exclamation"></i> Enter GST number for validation.');
            $("#err_GSTNNo").css("display", "flex");
            $("#GSTNNo").addClass("vm-input-error").focus();
            if (showError) toastr.warning("Enter GST number for validation.");
            return false;
        }
        return true;
    }

    if (!validateGST(showError)) return false;
    if (G_GSTINValidatedNo === gstVal) return true;

    try {
        var accountDesp = "";
        var configResponse = await VendorMasterService.GetGSTINStatus(accountDesp, gstVal);

        if (!Array.isArray(configResponse) || configResponse.length === 0) {
            throw "GST API configuration not found.";
        }
        var apiConfig = configResponse[0];

        var response = await CheckGSTNStatus(apiConfig, gstVal, accountDesp);
        var gstModel = getGSTINStatusModel(response, gstVal);

        $("#err_GSTNNo").hide();
        $("#GSTNNo").removeClass("vm-input-error");
        bindGSTINAddressToVendorForm(gstModel);
        showGSTINStatusModal(gstModel);
        $("#chkGSTINValidation").prop("checked", true);
        G_GSTINValidatedNo = gstModel.gstin;
        setGSTINValidationStatus("GST validated", "is-success");
        if (showError) toastr.success("GST validated successfully.");
        return true;
    } catch (err) {
        console.error("GetGSTINStatus error:", err);
        G_GSTINValidatedNo = "";
        $("#chkGSTINValidation").prop("checked", false);
        setGSTINValidationStatus("Validation failed", "is-error");
        $("#GSTNNo").addClass("vm-input-error").focus();
        if (showError) toastr.error(typeof err === "string" ? err : "GSTIN validation failed.");
        return false;
    }
}
/** Main vendor email — required + format on save; treatEmptyAsOk for live input (format only when non-empty). */
function validateEmail(showError, treatEmptyAsOk) {
    var val = ($("#EMail").val() || "").trim();
    if (!val) {
        if (showError && !treatEmptyAsOk) {
            $("#err_EMail").css("display", "flex");
            $("#EMail").addClass("vm-input-error");
            return false;
        }
        $("#err_EMail").hide();
        $("#EMail").removeClass("vm-input-error");
        return true;
    }
    var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(val)) {
        if (showError) {
            $("#err_EMail").css("display", "flex");
            $("#EMail").addClass("vm-input-error");
        }
        return false;
    }
    $("#err_EMail").hide();
    $("#EMail").removeClass("vm-input-error");
    return true;
}
/** India mobile: required on save, 10 digits starting with 6–9; treatEmptyAsOk for live input. */
function validatePhone(showError, treatEmptyAsOk) {
    var phoneVal = ($("#PhoneNo").val() || "").trim();
    if (!phoneVal) {
        if (showError && !treatEmptyAsOk) {
            $("#err_PhoneNo").css("display", "flex");
            $("#PhoneNo").addClass("vm-input-error");
            return false;
        }
        $("#err_PhoneNo").hide();
        $("#PhoneNo").removeClass("vm-input-error");
        return true;
    }
    var phonePattern = /^[6-9]\d{9}$/;
    if (!phonePattern.test(phoneVal)) {
        if (showError) {
            $("#err_PhoneNo").css("display", "flex");
            $("#PhoneNo").addClass("vm-input-error");
        }
        return false;
    }
    $("#err_PhoneNo").hide();
    $("#PhoneNo").removeClass("vm-input-error");
    return true;
}
function validateCPMobile(showError) {
    var val = $("#ContactPersonMobile").val();
    if (!val) {
        $("#err_ContactPersonMobile").hide();
        $("#ContactPersonMobile").removeClass("vm-input-error");
        return true;
    }
    var pattern = /^[6-9]\d{9}$/;
    if (!pattern.test(val)) {
        if (showError) {
            $("#err_ContactPersonMobile").css("display", "flex");
            $("#ContactPersonMobile").addClass("vm-input-error");
        }
        return false;
    }
    $("#err_ContactPersonMobile").hide();
    $("#ContactPersonMobile").removeClass("vm-input-error");
    return true;
}
function validateCPEmail(showError) {
    var val = $("#ContactPersonEMail").val();
    if (!val) {
        $("#err_ContactPersonEMail").hide();
        $("#ContactPersonEMail").removeClass("vm-input-error");
        return true;
    }
    var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(val)) {
        if (showError) {
            $("#err_ContactPersonEMail").css("display", "flex");
            $("#ContactPersonEMail").addClass("vm-input-error");
        }
        return false;
    }
    $("#err_ContactPersonEMail").hide();
    $("#ContactPersonEMail").removeClass("vm-input-error");
    return true;
}
function ClearVendorForm() {
    G_VendorSuppressCityAddressFill = true;
    G_VendorProgrammaticNationStateCity = true;
    G_BillNameSyncedWithVendorName = true;
    window.vmVendorFormHasAttachmentYes = false;
    vmResetVendorAttachment();
    $("#AccountDesp").removeData("vm-had-chars");
    // Text inputs (Address1/Address2 must clear on New; Pin uses id PinCode, not Pin)
    ["AccountDesp", "BillName", "VendorCode", "GSTNNo", "PANNo", "EMail", "PhoneNo", "Address1", "Address2"].forEach(function (id) {
        $("#" + id)
            .val("")
            .removeClass("vm-input-error")
            .prop("readonly", false)
            .prop("disabled", false);
        var errEl = $("#err_" + id);
        if (errEl.length) errEl.hide();
        var dupEl = $("#dup_" + id);
        if (dupEl.length) dupEl.hide();
    });

    $("#PinCode")
        .val("")
        .removeClass("vm-input-error");
    $("#err_PinCode").hide();

    $("#Nation").val("").trigger("change");
    $("#State").val("").trigger("change");
    $("#City").val("").trigger("change");

    G_VendorProgrammaticNationStateCity = false;
    G_VendorSuppressCityAddressFill = false;

    // Nature dropdown
    $("#Nature").val("");
    $("#IndustryTypeMaster").val("").trigger("change");

    // ContactPerson fields
    $("#ContactPersonName").val("");
    $("#ContactPersonDesignation").val("");
    $("#ContactPersonMobile").val("").removeClass("vm-input-error");
    $("#PhoneNo").val("").removeClass("vm-input-error");
    $("#err_ContactPersonMobile").hide();
    $("#err_PhoneNo").hide();
    $("#ContactPersonEMail").val("").removeClass("vm-input-error");
    $("#EMail").val("").removeClass("vm-input-error");
    $("#err_ContactPersonEMail").hide();
    $("#err_EMail").hide();
    $("#err_Nation, #err_City, #err_State").hide();
    $("#Nation, #State, #City").each(function () {
        $(this).removeClass("vm-input-error");
        $(this).next(".select2-container").removeClass("vm-select-error");
    });

    // BankAccount fields
    $("#BankName").val("");
    $("#BankAddress").val("");
    $("#AccountNo").val("");
    $("#IFSCCode").val("");
    $("#Refrence").val("");

    $("#vmBtnSaveVendor").show().prop("disabled", false);
    $("#vmBtnCancelVendor").html('<i class="fas fa-times"></i> Cancel');
    updatePanRequiredUi();
    if (typeof vmSyncVendorFormAttachBarState === "function") {
        vmSyncVendorFormAttachBarState(0);
    }
}
function CloseVendorForm() {
    ClearVendorForm();
    G_EditCode = 0;
    G_ViewCode = 0;
    window.vmVendorAttachmentHighlightCode = 0;
    $("#vendorDialogBackdrop").removeClass("show");
    if (typeof refreshVendorMasterGrid === "function" && (window.G_VendorMasterSourceRows || []).length) {
        refreshVendorMasterGrid();
    }
}
function ShowVendorSuccessModal(title, text, iconClass) {
    $("#vmSuccessModalTitle").text(title || "Done!");
    $("#vmSuccessModalText").text(text || "Operation completed successfully.");
    $("#vmSuccessModalIcon")
        .removeClass()
        .addClass("fas " + (iconClass || "fa-circle-check"));
    $("#vmSuccessBackdrop").addClass("show");
}
function CloseVendorSuccessModal() {
    $("#vmSuccessBackdrop").removeClass("show");
}
function getFinancialYear() {
    var d = new Date();
    var month = d.getMonth();
    var year = d.getFullYear();
    if (month < 3) year = year - 1;
    return year + "-" + (year + 1);
}
function vmVendorPickFirst(obj, keys) {
    if (!obj) return undefined;
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
    }
    return undefined;
}

/** Same rules as EditVendor — handles VendorMaster wrapper or [ [row], bank[], cp[] ] arrays. */
function vmResolveVendorMasterItemFromApiResponse(res) {
    var raw = res && (res.data || res.Data || res);
    var item = null;
    var list = raw && (raw.VendorMaster || raw.VendorMasterList);
    if (list && Array.isArray(list) && list.length > 0) {
        item = list[0];
    } else if (Array.isArray(raw) && raw.length > 0) {
        if (Array.isArray(raw[0]) && raw[0].length > 0) {
            item = raw[0][0];
        } else {
            item = raw[0];
        }
    } else if (raw && typeof raw === "object" && raw.AccountDesp !== undefined) {
        item = raw;
    }
    return { raw: raw, item: item };
}

/** Add/Edit modal Vendor Code input (avoids wrong #VendorCode if DOM ever duplicates). */
function vmVendorCodeField() {
    var $v = $("#vendorDialogBackdrop #VendorCode");
    return $v.length ? $v : $("#VendorCode");
}

/** View modal: show industry name from row, or resolve label by IndustryTypeMaster_Code via GetIndustryType. */
function vmFillViewIndustryType(item) {
    var label = vmVendorPickFirst(item, [
        "IndustryTypeMaster_Name",
        "IndustryTypeName",
        "IndustryType",
        "IndustryTypeDesp",
        "Industry_Type"
    ]);
    if (label) {
        $("#vf_IndustryType").text(label);
        return;
    }
    var code = vmVendorPickFirst(item, [
        "IndustryTypeMaster_Code",
        "industryTypeMaster_Code",
        "IndustryTypeMasterCode"
    ]);
    if (code === undefined || code === null || String(code).trim() === "" || String(code) === "0") {
        $("#vf_IndustryType").text("—");
        return;
    }
    $("#vf_IndustryType").text("…");
    VendorMasterService.GetIndustryType()
        .then(function (resObj) {
            var raw = resObj && (resObj.data || resObj.Data || resObj);
            var rows = Array.isArray(raw) ? raw : [];
            var c = parseInt(String(code), 10);
            if (!Number.isFinite(c)) {
                $("#vf_IndustryType").text(String(code));
                return;
            }
            var found = null;
            for (var i = 0; i < rows.length; i++) {
                var r = rows[i];
                var rc = parseInt(String(r.Code != null ? r.Code : r.code), 10);
                if (Number.isFinite(rc) && rc === c) {
                    found = r;
                    break;
                }
            }
            var name = found && (found.IndustryType || found.industryType || found.Desp || "");
            $("#vf_IndustryType").text(name || "—");
        })
        .catch(function () {
            $("#vf_IndustryType").text(String(code));
        });
}
function vmVendorNormalizeCityApiResponse(res) {
    if (!res) return null;
    if (Array.isArray(res) && res.length) return res[0];
    return res;
}
function vmVendorSetNationStatePin(countryCode, stateCode, Pin, stateName, countryName) {
    G_VendorProgrammaticNationStateCity = true;
    var setPin = function () {
        if (Pin !== undefined && Pin !== null && String(Pin) !== "") {
            $("#PinCode").val(String(Pin).replace(/\D/g, "").slice(0, 6));
            $("#err_PinCode").hide();
            $("#PinCode").removeClass("vm-input-error");
        }
    };
    var endProg = function () {
        G_VendorProgrammaticNationStateCity = false;
    };
    if (countryCode) {
        $("#Nation").val(String(countryCode)).trigger("change");
        setTimeout(function () {
            if (stateCode) {
                $("#State").val(String(stateCode)).trigger("change");
            } else if (stateName) {
                SelectOptionByText("State", stateName);
            }
            setTimeout(function () {
                setPin();
                endProg();
            }, 50);
        }, 80);
    } else if (countryName) {
        SelectOptionByText("Nation", countryName);
        setTimeout(function () {
            if (stateCode) {
                $("#State").val(String(stateCode)).trigger("change");
            } else if (stateName) {
                SelectOptionByText("State", stateName);
            }
            setTimeout(function () {
                setPin();
                endProg();
            }, 50);
        }, 80);
    } else {
        if (stateCode) {
            $("#State").val(String(stateCode)).trigger("change");
        } else if (stateName) {
            SelectOptionByText("State", stateName);
        }
        setPin();
        endProg();
    }
}
function vmVendorApplyAddressFromCity(cityCode) {
    if (G_VendorSuppressCityAddressFill) return;
    if (!cityCode) return;
    var row = null;
    for (var i = 0; i < G_VendorCityMasterList.length; i++) {
        var r = G_VendorCityMasterList[i];
        if (r && String(r.Code) === String(cityCode)) {
            row = r;
            break;
        }
    }
    var countryCode = row ? vmVendorPickFirst(row, ["CountryMaster_Code", "countryMaster_Code", "Country_Code"]) : undefined;
    var stateCode = row ? vmVendorPickFirst(row, ["StateMaster_Code", "stateMaster_Code"]) : undefined;
    var pin = row ? vmVendorPickFirst(row, ["Pin", "Pin", "Pin", "Pin"]) : undefined;
    var stateName = row ? vmVendorPickFirst(row, ["StateName", "stateName"]) : undefined;
    var countryName = row ? vmVendorPickFirst(row, ["CountryName", "countryName", "NationName"]) : undefined;

    function applyAll() {
        vmVendorSetNationStatePin(countryCode, stateCode, pin, stateName, countryName);
    }

    if (countryCode && stateCode) {
        applyAll();
        return;
    }

    var cityName = $("#City option:selected").text();
    if (!cityName || cityName === "select") {
        if (countryCode || stateCode || pin !== undefined) applyAll();
        return;
    }

    VendorMasterService.GetCityMasterByName(cityName, "CityMasterByName")
        .then(function (res) {
            if (G_VendorSuppressCityAddressFill) return;
            var apiRow = vmVendorNormalizeCityApiResponse(res);
            if (apiRow) {
                if (!countryCode) countryCode = vmVendorPickFirst(apiRow, ["CountryMaster_Code", "countryMaster_Code"]);
                if (!stateCode) stateCode = vmVendorPickFirst(apiRow, ["StateMaster_Code", "stateMaster_Code"]);
                if (!stateName) stateName = vmVendorPickFirst(apiRow, ["StateName", "stateName"]);
                if (!countryName) countryName = vmVendorPickFirst(apiRow, ["CountryName", "countryName"]);
                if (pin === undefined || pin === null || pin === "")
                    pin = vmVendorPickFirst(apiRow, ["Pin", "Pin", "Pin"]);
            }
            applyAll();
        })
        .catch(function () {
            if (countryCode || stateCode || pin !== undefined) applyAll();
        });
}
function GetCityList() {

    VendorMasterService.GetCityList().then(function (resObj) {
        G_VendorCityMasterList = Array.isArray(resObj) ? resObj : [];
        BindSelectList($('#City')[0], resObj.map((item) => ({ Code: item.Code, Desp: item.CityName })));
        $('#City').select2({
            width: '-webkit-fill-available',
            dropdownParent: vmGetIndustryTypeSelect2DropdownParent(),
            allowClear: false
        });
    });
}
function GetStateList() {

    VendorMasterService.GetStateList().then(function (resObj) {
        BindSelectList($('#State')[0], resObj.map((item) => ({ Code: item.Code, Desp: item.StateName })));
        $('#State').select2({
            width: '-webkit-fill-available',
            dropdownParent: vmGetIndustryTypeSelect2DropdownParent(),
            allowClear: false
        });
    });
}
function GetNationList() {

    VendorMasterService.GetNationList().then(function (resObj) {
        BindSelectList($('#Nation')[0], resObj.map((item) => ({ Code: item.Code, Desp: item.CountryName })));
        $('#Nation').select2({
            width: '-webkit-fill-available',
            dropdownParent: vmGetIndustryTypeSelect2DropdownParent(),
            allowClear: false
        });
    });
}

/** Shared: Select2 Industry Type attaches to form modal so blur/outside-click does not drop selection. */
function vmGetIndustryTypeSelect2DropdownParent() {
    var $formModal = $("#vendorFormContainer");
    if ($formModal.length) return $formModal;
    var $bd = $("#vendorDialogBackdrop");
    return $bd.length ? $bd : $(document.body);
}

/** Industry type master — option text = name, value = Code (IndustryTypeMaster_Code in save payload).
 *  @param selectCodeAfter — after quick-add save: explicit code to select
 *  @param options.vendorIndustryCode — Edit Vendor: always apply this value after reload (overrides previousVal) */
function GetIndustryTypeMasterList(selectCodeAfter, options) {
    options = options || {};
    var hasVendorIndustry = Object.prototype.hasOwnProperty.call(options, "vendorIndustryCode");
    var explicitAfter =
        !hasVendorIndustry &&
        selectCodeAfter !== undefined &&
        selectCodeAfter !== null &&
        String(selectCodeAfter).trim() !== "";

    window._vmIndustryTypeListSeq = (window._vmIndustryTypeListSeq || 0) + 1;
    var seq = window._vmIndustryTypeListSeq;

    return VendorMasterService.GetIndustryType()
        .then(function (resObj) {
            if (seq !== window._vmIndustryTypeListSeq) return;

            var previousVal = "";
            if (!explicitAfter && !hasVendorIndustry) {
                try {
                    var $ind = $("#IndustryTypeMaster");
                    if ($ind.length) {
                        previousVal = $ind.val() || "";
                        if (!previousVal && $ind.data("select2")) {
                            var s2Data = $ind.select2("data");
                            if (s2Data && s2Data.length && s2Data[0] && s2Data[0].id != null && String(s2Data[0].id) !== "") {
                                previousVal = String(s2Data[0].id);
                            }
                        }
                    }
                } catch (e) {
                    previousVal = "";
                }
            }

            if ($("#IndustryTypeMaster").length && $("#IndustryTypeMaster").data("select2")) {
                try {
                    $("#IndustryTypeMaster").select2("destroy");
                } catch (e) {
                    /* ignore */
                }
            }

            var raw = resObj && (resObj.data || resObj.Data || resObj);
            var rows = Array.isArray(raw) ? raw : [];
            var mapped = rows.map(function (item) {
                return {
                    Code: item.Code,
                    Desp: item.IndustryType || item.industryType || ""
                };
            });
            BindSelectList($("#IndustryTypeMaster")[0], mapped);
            $("#IndustryTypeMaster").select2({
                width: "-webkit-fill-available",
                dropdownParent: vmGetIndustryTypeSelect2DropdownParent(),
                allowClear: false
            });
            if (hasVendorIndustry) {
                var vic = options.vendorIndustryCode;
                var norm =
                    vic == null || vic === "" || (typeof vic === "string" && vic.trim() === "") || String(vic) === "0"
                        ? ""
                        : String(vic);
                vmSetIndustryTypeMasterFromCode(norm);
            } else if (explicitAfter) {
                vmSetIndustryTypeMasterFromCode(String(selectCodeAfter));
            } else if (previousVal) {
                vmSetIndustryTypeMasterFromCode(previousVal);
            }
        })
        .catch(function (err) {
            if (seq !== window._vmIndustryTypeListSeq) return;
            console.warn("GetIndustryTypeMasterList:", err);
            if ($("#IndustryTypeMaster").length && $("#IndustryTypeMaster").data("select2")) {
                try {
                    $("#IndustryTypeMaster").select2("destroy");
                } catch (e) {
                    /* ignore */
                }
            }
            BindSelectList($("#IndustryTypeMaster")[0], []);
            $("#IndustryTypeMaster").select2({
                width: "-webkit-fill-available",
                dropdownParent: vmGetIndustryTypeSelect2DropdownParent(),
                allowClear: false
            });
        });
}

function vmExtractNewIndustryCode(res) {
    if (!res) return null;
    var c =
        res.Code !== undefined && res.Code !== null
            ? res.Code
            : res.code !== undefined && res.code !== null
              ? res.code
              : res.IdentityCode !== undefined
                ? res.IdentityCode
                : res.NewCode;
    if (c !== undefined && c !== null && String(c) !== "") return c;
    var d = res.Data || res.data;
    if (d && typeof d === "object") {
        var dc =
            d.Code !== undefined && d.Code !== null
                ? d.Code
                : d.code !== undefined && d.code !== null
                  ? d.code
                  : d.IdentityCode;
        if (dc !== undefined && dc !== null && String(dc) !== "") return dc;
    }
    return null;
}

function vmIndustryTypeSaveSucceeded(res) {
    if (!res) return false;
    if (res.Status === "Y" || res.status === "Y" || res.Status === 1 || res.status === 1) return true;
    if (res.Status === "N" || res.status === "N") return false;
    if (res.Success === true || res.success === true) return true;
    if (vmExtractNewIndustryCode(res) != null) return true;
    return false;
}

function vmOpenIndustryTypeQuickAdd() {
    $("#vmIndustryTypeNewName").val("");
    $("#vmIndustryTypeQuickBackdrop").addClass("show");
    setTimeout(function () {
        $("#vmIndustryTypeNewName").trigger("focus");
    }, 120);
}

function vmCloseIndustryTypeQuickAdd() {
    $("#vmIndustryTypeQuickBackdrop").removeClass("show");
}

function vmSaveNewIndustryType() {
    var name = ($("#vmIndustryTypeNewName").val() || "").trim();
    if (!name) {
        toastr.warning("Enter industry type name.");
        $("#vmIndustryTypeNewName").trigger("focus");
        return;
    }
    VendorMasterService.SaveIndustryType(name)
        .then(function (res) {
            if (vmIndustryTypeSaveSucceeded(res)) {
                toastr.success((res && (res.Msg || res.msg)) || "Industry type saved.");
                var newCode = vmExtractNewIndustryCode(res);
                vmCloseIndustryTypeQuickAdd();
                GetIndustryTypeMasterList(newCode);
            } else {
                toastr.error((res && (res.Msg || res.msg)) || "Failed to save industry type.");
            }
        })
        .catch(function (err) {
            console.error("SaveIndustryType:", err);
            toastr.error("Error saving industry type.");
        });
}
function BindSelectList(element, list) {
    let option = '<option value="">select</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '" >' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
function SelectOptionByText(Id, FindText) {
    var dd = document.getElementById(Id);
    for (var i = 0; i < dd.options.length; i++) {
        if (dd.options[i].text === FindText) {
            dd.selectedIndex = i;
            break;
        }
    }
    $('#' + Id).select2({
        width: '-webkit-fill-available',
        dropdownParent: vmGetIndustryTypeSelect2DropdownParent(),
        allowClear: false
    });
}

window.OpenNewVendor = OpenNewVendor;
window.EditVendor = EditVendor;
window.ViewVendor = ViewVendor;
window.VerifyVendor = VerifyVendor;
window.CloseVendorVerifyModal = CloseVendorVerifyModal;
window.DoVendorVerify = DoVendorVerify;
window.CloseVendorViewModal = CloseVendorViewModal;
window.EditFromVendorView = EditFromVendorView;
window.ConfirmVendorDelete = ConfirmVendorDelete;
window.DoVendorDelete = DoVendorDelete;
window.SaveVendor = SaveVendor;
window.CloseVendorSuccessModal = CloseVendorSuccessModal;
window.vmFileUploadChange = vmFileUploadChange;
window.vmViewAttachment = vmViewAttachment;
window.vmViewVendorAttachmentFromModal = vmViewVendorAttachmentFromModal;
window.vmDownloadVendorAttachment = vmDownloadVendorAttachment;
window.vmDownloadVendorAttachmentFromViewModal = vmDownloadVendorAttachmentFromViewModal;
window.PrintVendor = PrintVendor;
window.PrintVendorFromView = PrintVendorFromView;
window.InitAttachmentControl = InitAttachmentControl;
window.openVendorMasterAttachmentControl = openVendorMasterAttachmentControl;
window.openVendorMasterListAttachmentControl = openVendorMasterListAttachmentControl;
window.vmOpenIndustryTypeQuickAdd = vmOpenIndustryTypeQuickAdd;
window.vmCloseIndustryTypeQuickAdd = vmCloseIndustryTypeQuickAdd;
window.vmSaveNewIndustryType = vmSaveNewIndustryType;
