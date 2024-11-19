import { AttachmentControlService } from '../../JSServices/_AttachmentControlService.js'

////////const fileInput = document.getElementById('fileInput');
////////const fileList = document.getElementById('fileList');
//alert("AttachmentControlService");
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
window.Download_AttachmentControl = Download_AttachmentControl;
window.Delete_AttachmentControl = Delete_AttachmentControl;
window.DownloadAll_AttachmentControl = DownloadAll_AttachmentControl;


GatAllAttachment()

