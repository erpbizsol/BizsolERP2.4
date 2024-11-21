import { AttachmentControlService } from '../../JSServices/_AttachmentControlService.js'


function GatAllAttachment() {
    AttachmentControlService.GetAttachmentUploadFiles($('#hfMasterTableName').val(), $('#hfMasterTableCode').val()).then(function (response) {
        console.log(response);
        response = response.map((item) => ({ Code: item.Code, "Document Particulars": item.DocumentParticulars, "File": '<a href="#" onclick="Download_AttachmentControl(' + item.Code + ',\'' + item.DocumentName + '\',\'N\')">' + item.DocumentName + '</a>', Download: '<i class="fa fa-download" onclick="Download_AttachmentControl(' + item.Code + ',\'' + item.DocumentName + '\',\'Y\')"></i>', Action: '<a class="btn btn-danger" onclick="Delete_AttachmentControl(' + item.Code +')"> <i class="fa fa-trash"></i></a>' }))
        const StringFilterColumn = ["DocumentName", "DocumentParticulars"];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = []
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["Code"];
        BizsolCustomFilterGrid.CreateDataTable("table-header-tbAttachmentControl", "table-body-tbAttachmentControl", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns)
        //CreateDataTable(headerId, bodyId, data, Button, ShowButtons=[], StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, HiddenColumns) 

    })
}
function Download_AttachmentControl(Code,fileName,IsDownload) {
    //  alert('downloadlol' + Code);
    AttachmentControlService.DownloadAttachment(Code).then(blob => {
            
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
    AttachmentControlService.DownloadAllAttachment($('#hfMasterTableName').val(), $('#hfMasterTableCode').val()).then(blob => {

        console.log(blob);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            // the filename you want
            a.download = "AllAttachement.zip";
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
const fileInput = document.getElementById('file-input');
const fileNamesInput = document.getElementById('file-names');
let fileList = document.getElementById('fileList');
let fileListArry=[]
loadatta();
function loadatta() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileNamesInput.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight text input when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        fileNamesInput.addEventListener(eventName, function () { fileNamesInput.classList.add('hover') }, false);
    });

    // Remove highlight when item is dragged out
    ['dragleave', 'drop'].forEach(eventName => {
        fileNamesInput.addEventListener(eventName, function () { fileNamesInput.classList.remove('hover') }, false);
    });

    // Handle drop event on text input
    fileNamesInput.addEventListener('drop', handleDrop, false);

    // Handle file input selection
    fileInput.addEventListener('change', () => handleFiles(fileInput.files), false);
}
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFiles(files) {
    if (files.length > 0) {
        for (let index = 0; index<files.length; index++) {
            const file = files[index];
            fileListArry.push(file);
        }
        UpdateFileUploadGrid();
    }
}

function UpdateFileUploadGrid() {
    fileList.innerHTML='';
    $.each(fileListArry, function (index, val) {
        const file = val;

        const fileItem = document.createElement('div');
        
        fileItem.classList.add('file-list-item');

        const fileParticularsInput = document.createElement('input');
        fileParticularsInput.type = "text";
        fileParticularsInput.placeholder = "Document Particulars";
        fileParticularsInput.classList.add('file-particulars-input');
        fileParticularsInput.setAttribute("id", "txtParticularsInput_" + index);

        const fileNameInput = document.createElement('a');
        fileNameInput.href = "#";
        fileNameInput.classList.add('file-name-input');
        fileNameInput.classList.add('m-2');
        fileNameInput.innerHTML = file.name;
        fileNameInput.setAttribute("onclick", "ViewFile_AttachmentControl(" + index +")");

        fileItem.appendChild(fileParticularsInput);
        fileItem.appendChild(fileNameInput);

        // Add delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('btn');
        deleteBtn.classList.add('btn-danger');
        deleteBtn.classList.add('m-2');
        deleteBtn.innerHTML = "<i class='fa fa-trash'></i>"
        deleteBtn.setAttribute("onclick", "DeleteFile_AttachmentControl("+index+")");
        

        fileItem.appendChild(deleteBtn);
        fileList.appendChild(fileItem);
    });
}
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
window.Download_AttachmentControl = Download_AttachmentControl;
window.Delete_AttachmentControl = Delete_AttachmentControl;
window.DownloadAll_AttachmentControl = DownloadAll_AttachmentControl;
window.DeleteFile_AttachmentControl = DeleteFile_AttachmentControl;
window.ViewFile_AttachmentControl = ViewFile_AttachmentControl;
window.Save_AttachmentControl = Save_AttachmentControl;
GatAllAttachment()

