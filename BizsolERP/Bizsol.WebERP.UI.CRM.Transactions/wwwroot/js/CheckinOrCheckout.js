

import { BizSolGeoLocation } from '/_content/Bizsol.WebERP.UI.Shared/js/BizSolGeoLocation.js';
import { CheckinOrCheckOutService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/CheckinOrCheckOutService.js';

function GetDayWiseCheckInOutList() {
    CheckinOrCheckOutService.GetDayWiseCheckInOut().then(function (response) {
        console.log(response);
        if (response.length > 0) {
            let lastRowIndex = response.length - 1;
            $('#btnSaveCheckInCheckOut')[0].innerHTML = response[lastRowIndex].ButtonText;
            $('#lblToday')[0].innerHTML = response[0].Today;
            $('#lblDuration')[0].innerHTML = response[0].DurationInHrs;
            if (response[lastRowIndex].ButtonText.toLowerCase().includes('in') == true) {
                $('#btnSaveCheckInCheckOut').removeClass('btn-danger');
                $('#btnSaveCheckInCheckOut').addClass('btn-primary');
            } else {
                $('#btnSaveCheckInCheckOut').removeClass('btn-primary');
                $('#btnSaveCheckInCheckOut').addClass('btn-danger');
            }

            //let checkInCheckOutGridRow = '<div class="row mb-6"><div class="col-md-6" ><label class="font-weight-bold"><b>Check-In-Time</b></label>';
            //checkInCheckOutGridRow += '<label><b></b ></label><input type="text" class="box_border form-control" disabled/></div>';
            //checkInCheckOutGridRow +='<div class="col-md-6 text-right"><label class="font-weight-bold"><b>Check-Out-Time</b></label>';
            //checkInCheckOutGridRow +='<label><b></b></label><input type="text" class="box_border form-control" disabled/></div>';
            //checkInCheckOutGridRow +='</div>';
            let checkInCheckOutGridRow = '';
            
            for (let i = response.length-1; i >=0;i--) {
                checkInCheckOutGridRow += '<div class="row mb-6"><div class="col-md-6" ><label class="font-weight-bold"><b>Check-In-Time</b></label>';
                checkInCheckOutGridRow += '<label><b> &nbsp;' + response[i].CheckInTime + '</b></label><input type="text" class="box_border form-control" value="' + response[i].CheckInLocation + '" disabled/></div>';
                checkInCheckOutGridRow += '<div class="col-md-6 text-right"><label class="font-weight-bold"><b>Check-Out-Time</b></label>';
                checkInCheckOutGridRow += '<label><b> &nbsp;' + response[i].CheckOutTime + '</b></label><input type="text" class="box_border form-control" value="' + response[i].CheckOutLocation + '" disabled/></div>';
                checkInCheckOutGridRow += '</div>';

            }
            $('#checkInCheckOutGrid')[0].innerHTML = checkInCheckOutGridRow;
            GetDistance();
        }
        

        
    });

}

function GetDistance() {
    CheckinOrCheckOutService.GetDistance().then(function (response) {
        if (response.length > 0) {
            $('#lblDistance')[0].innerHTML = response[0].Distance;
        }
    });
}

function SaveCheckInCheckOut() {
    let latitude = '000008', longitude = '90.889898', address = 'ithem';

    BizSolGeoLocation.GetActualLocation().then(function (response) {
        console.log(response);
    });
        //CheckinOrCheckOutService.SaveCheckIncheckOut(latitude, longitude, address).then(function (response) {
        //    if (response.Status === 'Y') {
        //        alert(response.Msg)
        //        GetDayWiseCheckInOutList();
        //    } 
        //});
}




GetDayWiseCheckInOutList();

window.SaveCheckInCheckOut = SaveCheckInCheckOut
