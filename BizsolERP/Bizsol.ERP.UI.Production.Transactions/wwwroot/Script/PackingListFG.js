import { StockTransferReceiveService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/StockTransferReceiveService.js';
$("#ERPHeading").text("Packing List FG");
ChangeMode('');
function ChangeMode(Mode) {
    $('#DivPackingListFGForm').hide();
    $('#DivPackingListFGViewGrid').hide();
    if (Mode === '') {
        
    } else {
        $('#DivPackingListFGForm').hide();
        $('#DivPackingListFGViewGrid').show();
    }

}

