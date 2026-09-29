import { EmailControlService } from '../../JSServices/_EmailControlService.js';

// ─── State ───────────────────────────────────────────────────────────────────
let _ecTags               = { To: [], CC: [], BCC: [] };
let _ecFiles              = [];   // [File | null]  — user-added files
let _ecDefaultAttachments = [];   // [{ FileName, FileBase64, ContentType }]  — pre-loaded by caller
let _ecCallBack           = '';

// ─── Open ────────────────────────────────────────────────────────────────────

window.EmailControl_Open = function (options) {
    options = options || {};
    _ecTags               = { To: [], CC: [], BCC: [] };
    _ecFiles              = [];
    _ecDefaultAttachments = [];
    _ecCallBack           = options.callBack || '';

    _ecClearAllTags();

    document.getElementById('ecSubject').value = options.subject || '';
    document.getElementById('ecBody').value    = options.body    || '';
    document.getElementById('ecAttachList').innerHTML = '';
    document.getElementById('ecSendBtn').disabled = false;
    document.getElementById('ecSendBtn').innerHTML = '<i class="fa fa-paper-plane"></i> Send Email';
    document.getElementById('ecFileInput').value = '';

    // Pre-fill To tags
    if (options.to) {
        const toList = Array.isArray(options.to)
            ? options.to
            : String(options.to).split(/[,;]+/).map(function (e) { return e.trim(); }).filter(Boolean);
        toList.forEach(function (e) { if (e) _ecAddTag('To', e); });
    }

    // Pre-load default attachments (already base64, e.g. PO PDF)
    if (options.defaultAttachments && options.defaultAttachments.length > 0) {
        _ecDefaultAttachments = options.defaultAttachments.slice();
        _ecDefaultAttachments.forEach(function (att, idx) {
            _ecRenderDefaultAttachItem(att, idx);
        });
    }

    bootstrap.Modal.getOrCreateInstance(document.getElementById('EmailControlModal')).show();
};

// ─── Tag helpers ─────────────────────────────────────────────────────────────

function _ecClearAllTags() {
    ['To', 'CC', 'BCC'].forEach(function (field) {
        _ecTags[field] = [];
        const wrap  = document.getElementById('ec' + field + 'TagsWrap');
        const input = document.getElementById('ec' + field + 'TagInput');
        Array.from(wrap.querySelectorAll('.ec-tag')).forEach(function (el) { el.remove(); });
        input.value = '';
        wrap.appendChild(input);
    });
}

function _ecAddTag(field, email) {
    email = email.trim();
    if (!email) return;
    if (_ecTags[field].indexOf(email) >= 0) return;
    _ecTags[field].push(email);

    const wrap  = document.getElementById('ec' + field + 'TagsWrap');
    const input = document.getElementById('ec' + field + 'TagInput');
    const tag   = document.createElement('span');
    tag.className = 'ec-tag';
    tag.setAttribute('data-email', email);
    tag.innerHTML = _ecEscHtml(email)
        + ' <span class="ec-tag-remove" onclick="EmailControl_RemoveTag(\''
        + field + '\',\'' + email.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + '\')">&times;</span>';
    wrap.insertBefore(tag, input);
}

function _ecEscHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

window.EmailControl_RemoveTag = function (field, email) {
    const idx = _ecTags[field].indexOf(email);
    if (idx >= 0) _ecTags[field].splice(idx, 1);
    const wrap = document.getElementById('ec' + field + 'TagsWrap');
    const tag  = wrap.querySelector('[data-email="' + email + '"]');
    if (tag) tag.remove();
};

window.EmailControl_TagKeyDown = function (field, e) {
    if (e.key === 'Enter' || e.key === ',' || e.key === ';' || e.key === 'Tab') {
        e.preventDefault();
        const input = document.getElementById('ec' + field + 'TagInput');
        const val   = input.value.trim().replace(/[,;]$/, '');
        if (val) { _ecAddTag(field, val); input.value = ''; }
    } else if (e.key === 'Backspace') {
        const input = document.getElementById('ec' + field + 'TagInput');
        if (!input.value && _ecTags[field].length > 0) {
            const last = _ecTags[field][_ecTags[field].length - 1];
            window.EmailControl_RemoveTag(field, last);
        }
    }
};

window.EmailControl_TagBlur = function (field) {
    const input = document.getElementById('ec' + field + 'TagInput');
    const val   = (input.value || '').trim().replace(/[,;]$/, '');
    if (val) { _ecAddTag(field, val); input.value = ''; }
};

// ─── File helpers ─────────────────────────────────────────────────────────────

function _ecAddFiles(fileList) {
    for (let i = 0; i < fileList.length; i++) {
        _ecFiles.push(fileList[i]);
        _ecRenderAttachItem(fileList[i], _ecFiles.length - 1);
    }
}

function _ecRenderAttachItem(file, idx) {
    const list = document.getElementById('ecAttachList');
    const size = (file.size / 1024).toFixed(1) + ' KB';
    const div  = document.createElement('div');
    div.className = 'ec-attach-item';
    div.id = 'ecAttach_' + idx;
    div.innerHTML = '<i class="fa fa-file-alt" style="color:#2563eb;font-size:13px;"></i>'
                  + '<span class="ec-attach-name">' + _ecEscHtml(file.name) + '</span>'
                  + '<span class="ec-attach-size">' + size + '</span>'
                  + '<button class="ec-attach-remove" onclick="EmailControl_RemoveFile(' + idx + ')" title="Remove">'
                  + '<i class="fa fa-times"></i></button>';
    list.appendChild(div);
}

window.EmailControl_RemoveFile = function (idx) {
    _ecFiles[idx] = null;
    const el = document.getElementById('ecAttach_' + idx);
    if (el) el.remove();
};

window.EmailControl_RemoveDefault = function (idx) {
    _ecDefaultAttachments[idx] = null;
    const el = document.getElementById('ecDefaultAttach_' + idx);
    if (el) el.remove();
};

function _ecRenderDefaultAttachItem(att, idx) {
    const list = document.getElementById('ecAttachList');
    const sizeKb = att.FileBase64
        ? ((att.FileBase64.length * 3 / 4) / 1024).toFixed(1) + ' KB'
        : '';
    const div = document.createElement('div');
    div.className = 'ec-attach-item ec-attach-default';
    div.id = 'ecDefaultAttach_' + idx;
    div.innerHTML = '<i class="fa fa-file-pdf" style="color:#e11d48;font-size:13px;"></i>'
                  + '<span class="ec-attach-name">' + _ecEscHtml(att.FileName) + '</span>'
                  + (sizeKb ? '<span class="ec-attach-size">' + sizeKb + '</span>' : '')
                  + '<span style="font-size:0.68rem;color:#6366f1;font-weight:600;padding:1px 6px;background:#ede9fe;border-radius:4px;">default</span>'
                  + '<button class="ec-attach-remove" onclick="EmailControl_RemoveDefault(' + idx + ')" title="Remove default attachment">'
                  + '<i class="fa fa-times"></i></button>';
    list.insertBefore(div, list.firstChild);
}

window.EmailControl_FileSelected = function (e) {
    _ecAddFiles(e.target.files);
    e.target.value = '';
};

window.EmailControl_Drop = function (e) {
    e.preventDefault();
    document.getElementById('ecDropzone').style.borderColor = '';
    if (e.dataTransfer && e.dataTransfer.files) _ecAddFiles(e.dataTransfer.files);
};

// ─── Validation ──────────────────────────────────────────────────────────────

function _ecValidateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

// ─── File → base64 ───────────────────────────────────────────────────────────

function _ecFileToBase64(file) {
    return new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.onloadend = function () {
            // result is "data:mime;base64,XXXX" — extract only the base64 part
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ─── Send ─────────────────────────────────────────────────────────────────────

window.EmailControl_Send = async function () {
    const btn = document.getElementById('ecSendBtn');

    // Flush any typed-but-unconfirmed tag inputs
    ['To', 'CC', 'BCC'].forEach(function (f) {
        const input = document.getElementById('ec' + f + 'TagInput');
        const val   = (input.value || '').trim().replace(/[,;]$/, '');
        if (val) { _ecAddTag(f, val); input.value = ''; }
    });

    // Validate To
    if (_ecTags.To.length === 0) {
        toastr.warning('Please enter at least one To email address.');
        return;
    }
    if (!_ecTags.To.every(_ecValidateEmail)) {
        toastr.warning('One or more To email addresses are invalid.');
        return;
    }
    if (_ecTags.CC.length > 0 && !_ecTags.CC.every(_ecValidateEmail)) {
        toastr.warning('One or more CC email addresses are invalid.');
        return;
    }
    if (_ecTags.BCC.length > 0 && !_ecTags.BCC.every(_ecValidateEmail)) {
        toastr.warning('One or more BCC email addresses are invalid.');
        return;
    }

    const subject = document.getElementById('ecSubject').value.trim();
    const body    = document.getElementById('ecBody').value.trim();
    if (!subject) { toastr.warning('Please enter a Subject.');       return; }
    if (!body)    { toastr.warning('Please enter a Message Body.');  return; }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Sending…';

    // 1. Default attachments (already base64 — e.g. PO print HTML/PDF)
    const attachments = [];
    _ecDefaultAttachments.forEach(function (att) {
        if (att !== null) attachments.push(att);
    });

    // 2. User-uploaded files → convert to base64
    const activeFiles = _ecFiles.filter(function (f) { return f !== null; });
    for (const file of activeFiles) {
        const base64 = await _ecFileToBase64(file);
        attachments.push({ FileName: file.name, FileBase64: base64, ContentType: file.type || 'application/octet-stream' });
    }

    const payload = {
        To:          _ecTags.To.join(','),
        CC:          _ecTags.CC.join(','),
        BCC:         _ecTags.BCC.join(','),
        Subject:     subject,
        Body:        body,
        Attachments: attachments
    };

    EmailControlService.SendEmail(payload)
        .then(function (res) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa fa-paper-plane"></i> Send Email';
            if (res && res.Status === 'Y') {
                toastr.success(res.Msg || 'Email sent successfully.');
                bootstrap.Modal.getInstance(document.getElementById('EmailControlModal')).hide();
                if (_ecCallBack && typeof window[_ecCallBack] === 'function') {
                    window[_ecCallBack](res);
                }
            } else {
                toastr.error((res && res.Msg) ? res.Msg : 'Failed to send email.');
            }
        })
        .catch(function () {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa fa-paper-plane"></i> Send Email';
        });
};

// ─── Expose globals ───────────────────────────────────────────────────────────
window.EmailControl_Open       = window.EmailControl_Open;
window.EmailControl_RemoveTag  = window.EmailControl_RemoveTag;
window.EmailControl_TagKeyDown = window.EmailControl_TagKeyDown;
window.EmailControl_TagBlur    = window.EmailControl_TagBlur;
window.EmailControl_FileSelected = window.EmailControl_FileSelected;
window.EmailControl_Drop       = window.EmailControl_Drop;
window.EmailControl_RemoveFile = window.EmailControl_RemoveFile;
window.EmailControl_Send       = window.EmailControl_Send;
