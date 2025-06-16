//import { GateEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/GateEntryService.js';

$("#ERPHeading").text("Quality Check");

let QRSacnDataArra = []
let baseUrl = sessionStorage.getItem('AppBaseURL');

function BindQualityCheckGrid() {
    ScanTextToJson();

   // QRSacnDataArra.push({ Code: 1, Name: "Manoj kumar" });

    const StringFilterColumn = [];
    const NumericFilterColumn = [];
    const DateFilterColumn = [];
    const Button = false;
    const showButtons = []
    const StringdoubleFilterColumn = [];
    const hiddenColumns = [];
    const ColumnAlignment = {};

    BizsolCustomFilterGrid.CreateDataTable("tbQRQualityCheckHeader", "tbQRQualityCheckBody", QRSacnDataArra, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)

}

function ScanTextToJson() {
    //let ScanText = 'JSW VIJAYANAGAR METALLICS LIMITEDSpecification:IS11513_2017CR2Heat No.|Mother Coil|Batch No.|Nominal Size (MM)|QTY(MT)|C %|Mn %|S %|P %|Si %|Al %|N %|||||||||||||||I103939||25251175|2.500 X 1500.0 X Coil X P| 29.045|0.0410|0.22|0.015|0.016|0.011|0.056|0.0048|||||||||||||||';
    let ScanText = $('#txtSacnQRText').val();

    ScanText = ScanText.replace('Heat', '|Heat');
    let objScanSplit = ScanText.split('|');

    if (objScanSplit.length > 0) {
        let HeadCount = objScanSplit.length/2;
        let ValueStartIndex = HeadCount;
        let DataJsonObj = {};
        DataJsonObj.Client = objScanSplit[0];
        for (let i = 1; i < HeadCount; i++) {

            DataJsonObj[objScanSplit[i]] = objScanSplit[ValueStartIndex]
            ValueStartIndex++;
        }
        QRSacnDataArra.push(DataJsonObj);

    }

}
function InitScanQRCodeByCameraControl(outputQRTextElementID, callBackFunctionName) {
    let url = baseUrl + '/CustomControl/ScanQRCodeByCameraControl';

    $('#DivScanQRCodeByCameraControlModal').load(url, { OutputQRTextElementID: outputQRTextElementID, CallBackFunctionName: callBackFunctionName });

}
function QRQualityCheck_btnScanQR() {

    InitScanQRCodeByCameraControl("txtSacnQRText", "QRQualityCheck_CallbackScanQRCode");
}
function QRQualityCheck_CallbackScanQRCode() {
    BindQualityCheckGrid();
    $('#txtSacnQRText').focus()
}

window.QRQualityCheck_CallbackScanQRCode = QRQualityCheck_CallbackScanQRCode;
window.QRQualityCheck_btnScanQR = QRQualityCheck_btnScanQR;
//BindQualityCheckGrid();
