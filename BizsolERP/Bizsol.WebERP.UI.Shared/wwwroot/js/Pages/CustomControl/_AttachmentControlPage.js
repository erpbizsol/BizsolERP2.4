import { AttachmentControlService } from '../../JSServices/_AttachmentControlService.js'

// ── Temp queue: persists in module memory for masterCode=0 (new/unsaved) entries ──
let _acTempQueue = []; // [{ file: File, particulars: string }]

/** Visible attachment modal (handles duplicate id when prior instance was left in body). */
function _acGetVisibleModalEl() {
    const nodes = document.querySelectorAll('[id="AttachmentControlmodal"]');
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].classList.contains('show')) return nodes[i];
    }
    return nodes.length ? nodes[nodes.length - 1] : null;
}

function _acCleanupModalArtifacts() {
    const openModals = document.querySelectorAll('.modal.show');
    if (openModals.length > 0) return;
    document.querySelectorAll('.modal-backdrop').forEach(function (b) { b.remove(); });
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
}

/** Remove stale attachment modals left in document.body from prior opens. */
function _acPurgeStaleModals(keepEl) {
    document.querySelectorAll('[id="AttachmentControlmodal"]').forEach(function (el) {
        if (keepEl && el === keepEl) return;
        if (window.bootstrap && window.bootstrap.Modal) {
            window.bootstrap.Modal.getInstance(el)?.dispose();
        }
        el.remove();
    });
    _acCleanupModalArtifacts();
}

function _acOnModalHidden(e) {
    const modalEl = e && e.target ? e.target : null;
    if (!modalEl || modalEl.id !== 'AttachmentControlmodal') return;
    if (window.bootstrap && window.bootstrap.Modal) {
        window.bootstrap.Modal.getInstance(modalEl)?.dispose();
    }
    modalEl.remove();
    _acCleanupModalArtifacts();
}

function PrepareAttachmentControlModal() {
    const modals = document.querySelectorAll('[id="AttachmentControlmodal"]');
    const keepEl = modals.length ? modals[modals.length - 1] : null;
    _acPurgeStaleModals(keepEl);
}

function DestroyAllAttachmentControlModals() {
    _acPurgeStaleModals(null);
}

function Show_AttachmentControl() {
    const modalEl = _acGetVisibleModalEl();
    if (!modalEl) return;

    _acPurgeStaleModals(modalEl);

    if (typeof window.erpMoveModalToBody === 'function') {
        window.erpMoveModalToBody(modalEl);
    } else if (modalEl.parentElement !== document.body) {
        document.body.appendChild(modalEl);
    }

    modalEl.removeEventListener('hidden.bs.modal', _acOnModalHidden);
    modalEl.addEventListener('hidden.bs.modal', _acOnModalHidden);

    try {
        if (window.bootstrap && window.bootstrap.Modal) {
            const existing = window.bootstrap.Modal.getInstance(modalEl);
            if (existing) existing.dispose();
            window.bootstrap.Modal.getOrCreateInstance(modalEl, {
                backdrop: 'static',
                keyboard: true,
                focus: true
            }).show();
        } else if (typeof window.jQuery !== 'undefined') {
            window.jQuery(modalEl).modal({ backdrop: 'static', keyboard: true });
            window.jQuery(modalEl).modal('show');
        }
    } catch (err) {
        console.warn('Show_AttachmentControl', err);
    }
}

function Close_AttachmentControl() {
    const modalEl = _acGetVisibleModalEl();
    if (!modalEl) {
        _acCleanupModalArtifacts();
        return;
    }
    try {
        if (window.bootstrap && window.bootstrap.Modal) {
            const inst = window.bootstrap.Modal.getInstance(modalEl)
                ?? window.bootstrap.Modal.getOrCreateInstance(modalEl);
            inst.hide();
            return;
        }
        if (typeof window.jQuery !== 'undefined') {
            window.jQuery(modalEl).modal('hide');
            return;
        }
    } catch (err) {
        console.warn('Close_AttachmentControl', err);
    }
    modalEl.classList.remove('show');
    modalEl.setAttribute('aria-hidden', 'true');
    modalEl.style.display = 'none';
    _acOnModalHidden({ target: modalEl });
}

function _acNotifySaveComplete() {
    if (typeof window.toastr !== 'undefined') {
        window.toastr.success('Upload saved.');
    } else {
        window.alert('Upload save..');
    }
}

/** Restore modal interactivity after alert() / grid refresh (focus trap & backdrop). */
function _acEnsureModalInteractive() {
    const modalEl = _acGetVisibleModalEl();
    if (!modalEl) return;
    modalEl.style.pointerEvents = 'auto';
    const z = parseInt(window.getComputedStyle(modalEl).zIndex || '1055', 10) || 1055;
    modalEl.style.zIndex = String(z);
    const backdrops = document.querySelectorAll('.modal-backdrop');
    if (backdrops.length) {
        backdrops[backdrops.length - 1].style.zIndex = String(z - 1);
    }
    if (document.body.classList.contains('modal-open') === false && modalEl.classList.contains('show')) {
        document.body.classList.add('modal-open');
    }
}

function _acIsTempMode() {
    return parseInt($('#hfMasterTableCode').val() ?? '0', 10) <= 0;
}

function _acEscHtml(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _acFileToByteArray(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = e => {
            if (e.target.readyState === FileReader.DONE)
                resolve(Array.from(new Uint8Array(e.target.result)));
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function _acNotifyQueueChange() {
    const count = _acTempQueue.length;
    const badge = document.getElementById('acQueueCountBadge');
    if (badge) badge.textContent = count > 0 ? '(' + count + ')' : '';
    if (typeof window.AttachmentControl_onQueueChange === 'function') {
        window.AttachmentControl_onQueueChange(count);
    }
}

function _acClearAttachmentTable() {
    const thead = document.getElementById('table-header-tbAttachmentControl');
    const tbody = document.getElementById('table-body-tbAttachmentControl');
    const pag = document.getElementById('paginator-tbAttachmentControl');
    if (thead) thead.innerHTML = '';
    if (tbody) tbody.innerHTML = '';
    if (pag) pag.innerHTML = '';
}

/**
 * Current control context from hidden fields (master/detail/entry).
 * Host pages should listen for `bizsol:attachmentcontrol:changed` on **document** (or window, after bubble),
 * or use jQuery: `$(document).on('bizsol:attachmentcontrol:changed', function (_e, d) { ... })`.
 */
function _acReadContextFromDom() {
    return {
        masterTableName: String($('#hfMasterTableName').val() ?? '').trim(),
        masterTableCode: parseInt($('#hfMasterTableCode').val() ?? '0', 10) || 0,
        detailTableName: String($('#hfDetailTableName').val() ?? '').trim(),
        detailTableCode: parseInt($('#hfDetailTableCode').val() ?? '0', 10) || 0,
        entryNo: String($('#hfEntryNo').val() ?? '').trim(),
        entryDate: String($('#hfEntryDate').val() ?? '').trim(),
        mode: String($('#hfMode').val() ?? '').trim(),
    };
}

/**
 * Notify host shell after server-backed attachment mutations so outer grids can reload (e.g. HasAttach / green clip).
 * @param {'save'|'delete'|'flush'} reason
 * @param {Record<string, *>} [extra] e.g. { attachmentCount, masterTableCode } from API or flush
 */
function _acNotifyHostDataMutated(reason, extra) {
    const base = _acReadContextFromDom();
    const detail = Object.assign(
        {
            reason,
            attachmentCount: 0,
            hasServerAttachments: false,
        },
        base,
        extra || {},
        { reason }
    );
    const mc = parseInt(String(detail.masterTableCode ?? 0), 10) || 0;
    detail.tempMode = mc <= 0;
    if (typeof detail.attachmentCount === 'number' && detail.attachmentCount > 0) {
        detail.hasServerAttachments = true;
    }
    try {
        const payload = Object.assign({}, detail);
        // Must target document with bubbles: true — window.dispatch + default bubbles:false
        // does not invoke document.addEventListener handlers.
        const evt = new CustomEvent('bizsol:attachmentcontrol:changed', {
            detail: payload,
            bubbles: true,
            cancelable: false,
        });
        document.dispatchEvent(evt);
    } catch (e) {
        console.warn('AttachmentControl: bizsol:attachmentcontrol:changed', e);
    }
    if (typeof window.AttachmentControl_onDataChanged === 'function') {
        try {
            window.AttachmentControl_onDataChanged(Object.assign({}, detail));
        } catch (e) {
            console.warn('AttachmentControl_onDataChanged', e);
        }
    }
    if (typeof window.jQuery !== 'undefined') {
        try {
            window.jQuery(document).trigger('bizsol:attachmentcontrol:changed', [Object.assign({}, detail)]);
        } catch (e) { /* ignore */ }
    }
}

/** Show/hide the existing/queued attachments block (header + table + download footer). */
function _acSetExistingAttachmentsBlockVisible(visible) {
    const el = document.getElementById('acExistingAttachmentsBlock');
    if (!el) return;
    el.style.display = visible ? '' : 'none';
}

function _acRenderTempQueueGrid() {
    if (_acTempQueue.length === 0) {
        _acSetExistingAttachmentsBlockVisible(false);
        _acClearAttachmentTable();
        return;
    }
    _acSetExistingAttachmentsBlockVisible(true);
    const rows = _acTempQueue.map(function (item, i) {
        return {
            'Document Particulars': _acEscHtml(item.particulars || '—'),
            'File': '<a href="#" onclick="window._acPreviewTempFile(' + i + '); return false;">' + _acEscHtml(item.file.name) + '</a>',
            'Remove': '<button class="btn btn-danger icon-height" onclick="RemoveTempQueue_AttachmentControl(' + i + ')"><i class="fa fa-trash"></i></button>'
        };
    });
    BizsolCustomFilterGrid.CreateDataTable(
        'table-header-tbAttachmentControl', 'table-body-tbAttachmentControl',
        rows, false, [], ['Document Particulars', 'File'], [], [], [], [], {}
    );
}

function GatAllAttachment() {
    const _acMode = ($('#hfMode').val() || '').toLowerCase();

    // view: hide upload form; all/addview: show upload form (addview = upload allowed, delete not)
    _acMode === "view" ? $('#fileUploadForm').hide() : $('#fileUploadForm').show();

    // ── Temp mode: masterCode = 0 (unsaved entry) ──────────────────────────
    if (_acIsTempMode()) {
        const footerEl = document.getElementById('acFooterBar');
        if (footerEl) footerEl.style.display = 'none';
        _acRenderTempQueueGrid();
        _acNotifyQueueChange();
        const n = _acTempQueue.length;
        return Promise.resolve({
            tempMode: true,
            attachmentCount: n,
            hasServerAttachments: false,
        });
    }

    _acSetExistingAttachmentsBlockVisible(false);

    var DetailTableName = $('#hfDetailTableName').val() == undefined || $('#hfDetailTableName').val() == "" ? "" : $('#hfDetailTableName').val();
    var DetailTableCode = $('#hfDetailTableCode').val() == undefined || $('#hfDetailTableCode').val() == "" ? 0 : $('#hfDetailTableCode').val();
    return AttachmentControlService.GetAttachmentUploadFiles($('#hfMasterTableName').val(), $('#hfMasterTableCode').val(), DetailTableName, DetailTableCode).then(function (response) {
        console.log(response);
        const raw = Array.isArray(response) ? response : [];
        // view & addview: no delete column; all: include delete column
        const mapped = (_acMode === "view" || _acMode === "addview")
            ? raw.map((item) => ({ Code: item.Code, "Document Particulars": item.DocumentParticulars, "File": '<a href="#" onclick="Download_AttachmentControl(' + item.Code + ',\'' + item.DocumentName + '\',\'N\')">' + item.DocumentName + '</a>', Download: '<a class="icon-height"><i class="fa fa-download" onclick="Download_AttachmentControl(' + item.Code + ',\'' + item.DocumentName + '\',\'Y\')"></i></a>' }))
            : raw.map((item) => ({ Code: item.Code, "Document Particulars": item.DocumentParticulars, "File": '<a href="#" onclick="Download_AttachmentControl(' + item.Code + ',\'' + item.DocumentName + '\',\'N\')">' + item.DocumentName + '</a>', Download: '<a class="icon-height"><i class="fa fa-download" onclick="Download_AttachmentControl(' + item.Code + ',\'' + item.DocumentName + '\',\'Y\')"></i></a>', Action: '<a class="btn btn-danger icon-height" onclick="Delete_AttachmentControl(' + item.Code + ')"> <i class="fa fa-trash"></i></a>' }));
        if (mapped.length === 0) {
            _acSetExistingAttachmentsBlockVisible(false);
            _acClearAttachmentTable();
            return { tempMode: false, attachmentCount: 0, hasServerAttachments: false };
        }
        _acSetExistingAttachmentsBlockVisible(true);
        const StringFilterColumn = ["DocumentName", "DocumentParticulars"];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = []
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["Code"];
        const ColumnAlignment = {};
        BizsolCustomFilterGrid.CreateDataTable("table-header-tbAttachmentControl", "table-body-tbAttachmentControl", mapped, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
        return { tempMode: false, attachmentCount: mapped.length, hasServerAttachments: true };
    }).catch(function (err) {
        console.warn('GatAllAttachment', err);
        return { tempMode: false, attachmentCount: 0, hasServerAttachments: false, error: err };
    });
}
function Download_AttachmentControl(Code,fileName,IsDownload) {
    //  alert('downloadlol' + Code);
    Showloader();
    AttachmentControlService.DownloadAttachment(Code).then(blob => {
        HideLoader();  
        console.log(blob);
        let IsOpen = false;
        let extension = fileName.split('.').pop();
        switch (extension.toLowerCase()) {
            case "txt":
                IsOpen = true;
                break;
            case "png":
                IsOpen = true;
                break;
            case "gif":
                IsOpen = true;
                break;
            case "jpeg":
                IsOpen = true;
                break;
            case "jpg":
                IsOpen = true;
        }

        const url = window.URL.createObjectURL(blob);
        if (IsOpen == true && IsDownload==='N') {
            window.open(url, '_blank');
        } else {
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            // the filename you want
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
        }
        window.URL.revokeObjectURL(url);

    })
        

        

}
function DownloadAll_AttachmentControl() {
    //  alert('downloadlol' + Code);
    let DetailTableName = $('#hfDetailTableName').val() == undefined || $('#hfDetailTableName').val() == "" ? "" : $('#hfDetailTableName').val();
    let DetailTableCode = $('#hfDetailTableCode').val() == undefined || $('#hfDetailTableCode').val() == "" ? 0 : $('#hfDetailTableCode').val();
    let SourceDownloadFileName = $('#hfSourceDownloadFileName').val() == undefined || $('#hfSourceDownloadFileName').val() == "" ? "" : $('#hfSourceDownloadFileName').val();
    Showloader();
    AttachmentControlService.DownloadAllAttachment($('#hfMasterTableName').val(), $('#hfMasterTableCode').val(), DetailTableName, DetailTableCode).then(blob => {
        HideLoader();
        console.log(blob);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            // the filename you want
            a.download = SourceDownloadFileName == "" ? "AllAttachement.zip" : SourceDownloadFileName +".zip";
            document.body.appendChild(a);
            a.click();
        window.URL.revokeObjectURL(url);
    })
}
function Delete_AttachmentControl(Code) {

    if (confirm("Are you sure! You want to delete this attachment ?") == true) {
        AttachmentControlService.DeleteImage(Code,"NA").then(
            function (response) {
                if (response.Status === 'Y') {
                    if (typeof window.toastr !== 'undefined') {
                        window.toastr.success('Attachment deleted!');
                    } else {
                        alert('Attachment deleted!');
                    }
                    GatAllAttachment().then(function (info) {
                        _acNotifyHostDataMutated('delete', info);
                        setTimeout(_acEnsureModalInteractive, 0);
                    }).catch(function (err) {
                        console.warn('GatAllAttachment after delete', err);
                    });
                } else {
                    if (typeof window.toastr !== 'undefined') {
                        window.toastr.error(response.Msg);
                    } else {
                        alert(response.Msg);
                    }
                }
            }
        )
    } 
}
//------- Attachment Upload Begin-----------//
//var fileInput = document.getElementById('file-input');
//var fileNamesInput = document.getElementById('file-names');

////window['AttachmentControl_fileInput']  = document.getElementById('file-input');
////window['AttachmentControl_fileNamesInput'] = document.getElementById('file-names');

//var fileList = document.getElementById('fileList');
//var fileListArry=[]

//function loadatta() {
//    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
//        fileNamesInput.addEventListener(eventName, preventDefaults, false);
//       // window['AttachmentControl_fileNamesInput'].addEventListener(eventName, preventDefaults, false);
//    });

//    // Highlight text input when item is dragged over it
//    ['dragenter', 'dragover'].forEach(eventName => {
//        fileNamesInput.addEventListener(eventName, function () { fileNamesInput.classList.add('hover') }, false);
//        //window['AttachmentControl_fileNamesInput'].addEventListener(eventName, function () { window['AttachmentControl_fileNamesInput'].classList.add('hover') }, false);
//    });

//   //  Remove highlight when item is dragged out
//    ['dragleave', 'drop'].forEach(eventName => {
//        fileNamesInput.addEventListener(eventName, function () { fileNamesInput.classList.remove('hover') }, false);
//       // window['AttachmentControl_fileNamesInput'].addEventListener(eventName, function () { window['AttachmentControl_fileNamesInput'].classList.remove('hover') }, false);
//    });

//   //  Handle drop event on text input
//    fileNamesInput.addEventListener('drop', handleDrop, false);
//    //window['AttachmentControl_fileNamesInput'].addEventListener('drop', handleDrop, false);

//    // Handle file input selection
//    fileInput.addEventListener('change', () => handleFiles(fileInput.files), false);
//    //window['AttachmentControl_fileInput'].addEventListener('change', () => handleFiles(window['AttachmentControl_fileInput'].files), false);
//}

//function preventDefaults(e) {
//    e.preventDefault();
//    e.stopPropagation();
//}

//function handleDrop(e) {
//    const dt = e.dataTransfer;
//    const files = dt.files;
//    handleFiles(files);
//}

//function handleFiles(files) {
//    if (files.length > 0) {
//        for (let index = 0; index<files.length; index++) {
//            const file = files[index];
//            fileListArry.push(file);
//        }
//        UpdateFileUploadGrid();
//    }
//}

//function UpdateFileUploadGrid() {
//    fileList.innerHTML='';
//    $.each(fileListArry, function (index, val) {
//        const file = val;

//        const fileItem = document.createElement('div');
        
//        fileItem.classList.add('file-list-item');

//        const fileParticularsInput = document.createElement('input');
//        fileParticularsInput.type = "text";
//        fileParticularsInput.placeholder = "Document Particulars";
//        fileParticularsInput.classList.add('file-particulars-input');
//        fileParticularsInput.setAttribute("id", "txtParticularsInput_" + index);

//        const fileNameInput = document.createElement('a');
//        fileNameInput.href = "#";
//        fileNameInput.classList.add('file-name-input');
//        fileNameInput.classList.add('m-2');
//        fileNameInput.innerHTML = file.name;
//        fileNameInput.setAttribute("onclick", "ViewFile_AttachmentControl(" + index +")");

//        fileItem.appendChild(fileParticularsInput);
//        fileItem.appendChild(fileNameInput);

//        // Add delete button
//        const deleteBtn = document.createElement('button');
//        deleteBtn.classList.add('btn');
//        deleteBtn.classList.add('btn-danger');
//        deleteBtn.classList.add('icon-height');
//        deleteBtn.classList.add('m-2');
//        deleteBtn.innerHTML = "<i class='fa fa-trash'></i>"
//        deleteBtn.setAttribute("onclick", "DeleteFile_AttachmentControl("+index+")");
        

//        fileItem.appendChild(deleteBtn);
//        fileList.appendChild(fileItem);
//    });
//}
function DeleteFile_AttachmentControl(index) {
    const items = document.querySelectorAll('.file-list-item');
    if (items[index]) {
        items[index].remove();
        fileListArry.splice(index, 1);
        UpdateFileUploadGrid();
    }
}
function ViewFile_AttachmentControl(index) {
    const file = fileListArry[index];
    if (fileListArry[index]) {
        
        let IsOpen = false;
        let fileName = file.name;
        let extension = fileName.split('.').pop();
        switch (extension.toLowerCase()) {
            case "txt":
                IsOpen = true;
                break;
            case "png":
                IsOpen = true;
                break;
            case "gif":
                IsOpen = true;
                break;
            case "jpeg":
                IsOpen = true;
                break;
            case "jpg":
                IsOpen = true;
        }

        const url = window.URL.createObjectURL(file);
        if (IsOpen == true) {
            window.open(url, '_blank');
        } else {
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
           
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
        }
        window.URL.revokeObjectURL(url);
    }
}
function Save_AttachmentControl() {
    let filesProcessed = 0;
    var validate = true;
    if (fileListArry.length == 0) {
        alert('Please check! you not choose any file to upload.')
        return false;
    }
    $.each(fileListArry, function (index, val) {
        const file = val;
        let documentParticulars = $('#txtParticularsInput_' + index);

        if (documentParticulars.val() == '') {
            alert('Please check! you not enter document particulars for:\n' + file.name);
            documentParticulars.focus();
            validate = false;
            return false;
        }
    });

    if (validate == false) {
        return false;
    }

    // ── Temp mode: queue locally, do not upload yet ─────────────────────────
    if (_acIsTempMode()) {
        $.each(fileListArry, function (index, val) {
            _acTempQueue.push({ file: val, particulars: $('#txtParticularsInput_' + index).val() });
        });
        fileList.innerHTML = '';
        fileListArry = [];
        GatAllAttachment();
        return;
    }

    $.each(fileListArry, function (index, val) {
        const file = val;
        let documentParticulars = $('#txtParticularsInput_' + index);

        //if (documentParticulars.val() == '') {
        //    alert('Please check! you not enter document particulars for:\n' + file.name);
        //    documentParticulars.focus();
        //    return false;
        //}

        
        let documentData = [];
        var fileByteArray = [];
        var reader = new FileReader();

        reader.readAsArrayBuffer(file);
        reader.onloadend = function (evt) {
            if (evt.target.readyState == FileReader.DONE) {
                var arrayBuffer = evt.target.result,
                    array = new Uint8Array(arrayBuffer);
                for (var i = 0; i < array.length; i++) {
                    fileByteArray.push(array[i]);
                }

                documentData.push({
                    code: 0,
                    documentParticulars: documentParticulars.val(),
                    documentName: file.name,
                    remarks: '',
                    masterTableName: $('#hfMasterTableName').val(),
                    masterTableCode: $('#hfMasterTableCode').val(),
                    detailTableName: $('#hfDetailTableName').val(),
                    detailTableCode: $('#hfDetailTableCode').val(),
                    linkedWith: 'N',
                    documentContent: fileByteArray,
                    entryNo: $('#hfEntryNo').val(),
                    entryDate: $('#hfEntryDate').val() === '' ? new Date().toISOString() : new Date($('#hfEntryDate').val()).toISOString(),
                    f_DefaultAttachmentOption_Code: 0
                });

                AttachmentControlService.SaveAttachment(JSON.stringify(documentData)).then(
                    (response) => {
                        filesProcessed++
                        if (filesProcessed == fileListArry.length) {
                            fileList.innerHTML = '';
                            fileListArry = [];
                            GatAllAttachment().then(function (info) {
                                _acNotifyHostDataMutated('save', info);
                                _acNotifySaveComplete();
                                setTimeout(_acEnsureModalInteractive, 0);
                            }).catch(function (err) {
                                console.warn('GatAllAttachment after save', err);
                                _acNotifySaveComplete();
                                setTimeout(_acEnsureModalInteractive, 0);
                            });
                        }
                    }
                );
            }
        }

        
       
    });
} 

//------------Attachment Upload End---------//

// ── Generic temp-queue API (called by host pages) ────────────────────────────
function RemoveTempQueue_AttachmentControl(index) {
    _acTempQueue.splice(index, 1);
    _acRenderTempQueueGrid();
    _acNotifyQueueChange();
}

window._acPreviewTempFile = function (index) {
    const item = _acTempQueue[index];
    if (!item) return;
    const ext = item.file.name.split('.').pop().toLowerCase();
    const viewable = ['txt', 'png', 'gif', 'jpeg', 'jpg', 'pdf'].includes(ext);
    const url = URL.createObjectURL(item.file);
    if (viewable) {
        window.open(url, '_blank');
    } else {
        const a = document.createElement('a');
        a.href = url; a.download = item.file.name; a.style.display = 'none';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
    setTimeout(() => URL.revokeObjectURL(url), 5000);
};

async function FlushPendingAttachments(masterCode, masterTableName, entryNo, entryDate) {
    if (!_acTempQueue.length) return { uploaded: 0, failed: 0 };
    const mc = parseInt(masterCode, 10) || 0;
    if (mc <= 0) return { uploaded: 0, failed: 0 };
    const tableName = masterTableName || $('#hfMasterTableName').val() || '';
    const en = parseInt(entryNo, 10) || 0;
    const dateIso = entryDate ? new Date(entryDate).toISOString() : new Date().toISOString();
    const detail = $('#hfDetailTableName').length ? ($('#hfDetailTableName').val() || '') : '';
    const detailCode = $('#hfDetailTableCode').length ? (parseInt($('#hfDetailTableCode').val() ?? '0', 10) || 0) : 0;
    let uploaded = 0, failed = 0;
    for (let i = 0; i < _acTempQueue.length; i++) {
        const { file, particulars } = _acTempQueue[i];
        try {
            const byteArr = await _acFileToByteArray(file);
            const payload = JSON.stringify([{
                code: 0,
                documentParticulars: particulars || file.name,
                documentName: file.name,
                remarks: '',
                masterTableName: tableName,
                masterTableCode: mc,
                detailTableName: detail,
                detailTableCode: detailCode,
                linkedWith: 'N',
                documentContent: byteArr,
                entryNo: en,
                entryDate: dateIso,
                f_DefaultAttachmentOption_Code: 0
            }]);
            await AttachmentControlService.SaveAttachment(payload);
            uploaded++;
        } catch (e) {
            console.error('FlushPendingAttachments[' + i + ']', e);
            failed++;
        }
    }
    _acTempQueue = [];
    _acNotifyQueueChange();
    if (uploaded > 0) {
        _acNotifyHostDataMutated('flush', {
            masterTableName: tableName,
            masterTableCode: mc,
            detailTableName: detail,
            detailTableCode: detailCode,
            attachmentCount: uploaded,
            hasServerAttachments: true,
            uploaded,
            failed,
        });
    }
    return { uploaded, failed };
}

function ClearPendingAttachments_AttachmentControl() {
    _acTempQueue = [];
    _acNotifyQueueChange();
}

function GetPendingAttachmentCount_AttachmentControl() {
    return _acTempQueue.length;
}

/**
 * Delete all attachments for a master row after the host successfully deletes that entry (e.g. grid delete).
 * Uses API POST DocumentAttachment/DeleteAllAttachment.
 * Fire-and-forget from hosts: .catch(() => {}) if you do not need the result.
 *
 * @param {string} masterTableName
 * @param {number|string} masterTableCode
 * @param {string} [detailTableName] default ''
 * @param {number|string} [detailTableCode] default 0
 * @returns {Promise<*>}
 */
function DeleteAllAttachmentsForMaster_AttachmentControl(masterTableName, masterTableCode, detailTableName, detailTableCode) {
    const mtn = String(masterTableName ?? '').trim();
    const mtc = parseInt(String(masterTableCode ?? 0), 10) || 0;
    const dtn = detailTableName != null && detailTableName !== undefined ? String(detailTableName) : '';
    const dtc = parseInt(String(detailTableCode ?? 0), 10) || 0;
    if (!mtn || mtc <= 0) {
        return Promise.resolve(null);
    }
    return AttachmentControlService.DeleteAllAttachment(mtn, mtc, dtn, dtc);
}

window.Download_AttachmentControl = Download_AttachmentControl;
window.Delete_AttachmentControl = Delete_AttachmentControl;
window.DownloadAll_AttachmentControl = DownloadAll_AttachmentControl;
window.DeleteFile_AttachmentControl = DeleteFile_AttachmentControl;
window.ViewFile_AttachmentControl = ViewFile_AttachmentControl;
window.Save_AttachmentControl = Save_AttachmentControl;
window.GatAllAttachment = GatAllAttachment;
window.Show_AttachmentControl = Show_AttachmentControl;
window.Close_AttachmentControl = Close_AttachmentControl;
window.PrepareAttachmentControlModal = PrepareAttachmentControlModal;
window.DestroyAllAttachmentControlModals = DestroyAllAttachmentControlModals;
window.DestroyExistingAttachmentControlModal = DestroyAllAttachmentControlModals;
window.RemoveTempQueue_AttachmentControl = RemoveTempQueue_AttachmentControl;
window.FlushPendingAttachments = FlushPendingAttachments;
window.ClearPendingAttachments_AttachmentControl = ClearPendingAttachments_AttachmentControl;
window.GetPendingAttachmentCount_AttachmentControl = GetPendingAttachmentCount_AttachmentControl;
window.DeleteAllAttachmentsForMaster_AttachmentControl = DeleteAllAttachmentsForMaster_AttachmentControl;
//window.loadatta = loadatta;
//GatAllAttachment();
//loadatta();


