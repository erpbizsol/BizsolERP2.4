import { AttachmentControlService } from '../../JSServices/_AttachmentControlService.js'

// ── Temp queue: persists in module memory for masterCode=0 (new/unsaved) entries ──
let _acTempQueue = []; // [{ file: File, particulars: string }]

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

function _acRenderTempQueueGrid() {
    if (_acTempQueue.length === 0) {
        document.getElementById('table-header-tbAttachmentControl').innerHTML = '';
        document.getElementById('table-body-tbAttachmentControl').innerHTML =
            '<tr><td colspan="3" style="text-align:center;padding:18px;color:#94a3b8;font-size:0.82rem;">' +
            '<i class="bx bx-inbox me-1"></i>No files queued yet. Browse or drag files above.</td></tr>';
        return;
    }
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

    $('#hfMode').val().toLowerCase() == "view" ? $('#fileUploadForm').hide() : $('#fileUploadForm').show();

    // ── Temp mode: masterCode = 0 (unsaved entry) ──────────────────────────
    if (_acIsTempMode()) {
        const footerEl = document.getElementById('acFooterBar');
        if (footerEl) footerEl.style.display = 'none';
        _acRenderTempQueueGrid();
        _acNotifyQueueChange();
        return;
    }

    var DetailTableName = $('#hfDetailTableName').val() == undefined || $('#hfDetailTableName').val() == "" ? "" : $('#hfDetailTableName').val();
    var DetailTableCode = $('#hfDetailTableCode').val() == undefined || $('#hfDetailTableCode').val() == "" ? 0 : $('#hfDetailTableCode').val();
    AttachmentControlService.GetAttachmentUploadFiles($('#hfMasterTableName').val(), $('#hfMasterTableCode').val(), DetailTableName, DetailTableCode).then(function (response) {
        console.log(response);
        response = $('#hfMode').val().toLowerCase() == "view" ? response.map((item) => ({ Code: item.Code, "Document Particulars": item.DocumentParticulars, "File": '<a href="#" onclick="Download_AttachmentControl(' + item.Code + ',\'' + item.DocumentName + '\',\'N\')">' + item.DocumentName + '</a>', Download: '<a class="icon-height"><i class="fa fa-download" onclick="Download_AttachmentControl(' + item.Code + ',\'' + item.DocumentName + '\',\'Y\')"></i></a>' }))
                    : response.map((item) => ({ Code: item.Code, "Document Particulars": item.DocumentParticulars, "File": '<a href="#" onclick="Download_AttachmentControl(' + item.Code + ',\'' + item.DocumentName + '\',\'N\')">' + item.DocumentName + '</a>', Download: '<a class="icon-height"><i class="fa fa-download" onclick="Download_AttachmentControl(' + item.Code + ',\'' + item.DocumentName + '\',\'Y\')"></i></a>', Action: '<a class="btn btn-danger icon-height" onclick="Delete_AttachmentControl(' + item.Code + ')"> <i class="fa fa-trash"></i></a>' }));
        const StringFilterColumn = ["DocumentName", "DocumentParticulars"];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = []
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["Code"];
        const ColumnAlignment = {};
        BizsolCustomFilterGrid.CreateDataTable("table-header-tbAttachmentControl", "table-body-tbAttachmentControl", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
    })
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
                    alert('Attachment deleted!');
                    GatAllAttachment();
                } else {
                    alert(response.Msg);
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
                            alert('Upload save..');
                            GatAllAttachment();
                            fileList.innerHTML = '';
                            fileListArry = [];
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
    return { uploaded, failed };
}

function ClearPendingAttachments_AttachmentControl() {
    _acTempQueue = [];
    _acNotifyQueueChange();
}

function GetPendingAttachmentCount_AttachmentControl() {
    return _acTempQueue.length;
}

window.Download_AttachmentControl = Download_AttachmentControl;
window.Delete_AttachmentControl = Delete_AttachmentControl;
window.DownloadAll_AttachmentControl = DownloadAll_AttachmentControl;
window.DeleteFile_AttachmentControl = DeleteFile_AttachmentControl;
window.ViewFile_AttachmentControl = ViewFile_AttachmentControl;
window.Save_AttachmentControl = Save_AttachmentControl;
window.GatAllAttachment = GatAllAttachment;
window.RemoveTempQueue_AttachmentControl = RemoveTempQueue_AttachmentControl;
window.FlushPendingAttachments = FlushPendingAttachments;
window.ClearPendingAttachments_AttachmentControl = ClearPendingAttachments_AttachmentControl;
window.GetPendingAttachmentCount_AttachmentControl = GetPendingAttachmentCount_AttachmentControl;
//window.loadatta = loadatta;
//GatAllAttachment();
//loadatta();


