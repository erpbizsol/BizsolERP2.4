import { QualityCheckService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/QualityCheckService.js';

$("#ERPHeading").text("Quality Check");


let baseUrl = sessionStorage.getItem('AppBaseURL');

async function BindQualityCheckGrid() {
   
    let QRSacnDataArra = []
    let ScanText = $('#txtSacnQRText').val();

    if (ScanText.includes("|") == false) {
        toastr.error('Invalid QR Code.');
        return;
    }

    ScanText = ScanText.replace('Heat', '|Heat');
    let objScanSplit = ScanText.split('|');

    if (objScanSplit.length > 0) {
        let HeadCount = objScanSplit.length / 2;
        let ValueStartIndex = HeadCount;
        let DataJsonObj = {};
        DataJsonObj.Client = objScanSplit[0];
        for (let i = 1; i < HeadCount; i++) {

            DataJsonObj[objScanSplit[i]] = objScanSplit[ValueStartIndex]
            ValueStartIndex++;
        }
        QRSacnDataArra.push(DataJsonObj);

    }


    if (!Array.isArray(QRSacnDataArra) || QRSacnDataArra.length === 0) {
        $('#tbQRQualityCheck tr').empty();
        $('#paginator-tbQRQualityCheck').empty();
        return;
    }

    await Promise.all(QRSacnDataArra.map(async item => {
        let HeadKey = Object.keys(item);

        await Promise.all(HeadKey.map(async keyItem => {
            if (keyItem !== "" && !keyItem.includes("Batch No") && !keyItem.includes("Mother Coil")) {
                let tempPayLoad = {
                    ScanQRText: JSON.stringify(QRSacnDataArra) + "##*#" + $('#txtSacnQRText').val(),
                    BatchNo: item["Batch No."],
                    MotherCoil: item["Mother Coil"],
                    QCParameter: keyItem,
                    QCParameterValue: item[keyItem]
                };

                let QRQualityRespon = await QualityCheckService.SaveQRQualityCheck(JSON.stringify(tempPayLoad));
                if (QRQualityRespon.Status === 'Y') {
                    toastr.success(QRQualityRespon.Msg);
                } else {
                    toastr.error(QRQualityRespon.Msg);
                }
               
            }
        }));

    }));

    const StringFilterColumn = [];
    const NumericFilterColumn = [];
    const DateFilterColumn = [];
    const Button = false;
    const showButtons = [];
    const StringdoubleFilterColumn = [];
    const hiddenColumns = [];
    const ColumnAlignment = {};

    BizsolCustomFilterGrid.CreateDataTable(
        "tbQRQualityCheckHeader",
        "tbQRQualityCheckBody",
        QRSacnDataArra,
        Button,
        showButtons,
        StringFilterColumn,
        NumericFilterColumn,
        DateFilterColumn,
        StringdoubleFilterColumn,
        hiddenColumns,
        ColumnAlignment
    );

    QRSacnDataArra = [];
}

function InitScanQRCodeByCameraControl(outputQRTextElementID, callBackFunctionName) {
    let url = baseUrl + '/CustomControl/ScanQRCodeByCameraControl';

    $('#DivScanQRCodeByCameraControlModal').load(url, { OutputQRTextElementID: outputQRTextElementID, CallBackFunctionName: callBackFunctionName });

}
function QRQualityCheck_btnScanQR() {

    InitScanQRCodeByCameraControl("txtSacnQRText", "QRQualityCheck_CallbackScanQRCode");
}
async function QRQualityCheck_CallbackScanQRCode() {
    await BindQualityCheckGrid();
    $('#txtSacnQRText').focus()
}
$('#txtSacnQRText').on('keyup keypress keydown', async function (e) {
    var keyCode = e.keyCode || e.which;
    if (keyCode === 13) {
        e.preventDefault();
        await BindQualityCheckGrid();
        $('#txtSacnQRText').focus()
        return false;
    }
});
window.QRQualityCheck_CallbackScanQRCode = QRQualityCheck_CallbackScanQRCode;
window.QRQualityCheck_btnScanQR = QRQualityCheck_btnScanQR;
//BindQualityCheckGrid();
