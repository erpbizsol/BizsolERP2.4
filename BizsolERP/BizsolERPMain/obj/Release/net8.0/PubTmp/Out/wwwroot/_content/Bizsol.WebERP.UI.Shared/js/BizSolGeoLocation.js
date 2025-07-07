import { promiseAjaxCallApi } from '../js/PromiseAjaxCallApi.js';

var options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
};

const BizSolGeoLocation = {
    GetActualLocation: function GetActualLocation() {

        if (navigator.geolocation) {
           
            return new Promise(function (resolve, reject) {
                navigator.geolocation.getCurrentPosition(function (response) {
                    var Address = '';
                    var result = {};
                    result.latitude = response.coords.latitude;
                    result.longitude = response.coords.longitude;
                    //var url = `${window.AppBaseURL}/GetLocation?latlng=${result.latitude},${result.longitude}`;
                    var url = `${sessionStorage.getItem('AppBaseURL')}/GetLocation?latlng=${result.latitude},${result.longitude}`;
                    return promiseAjaxCallApi.CallAPI('POST', url, "").then(
                        function (value) {
                            Address = JSON.stringify(value.results[0].formatted_address);
                            Address = Address.replaceAll('"', '');
                            result.Address = Address;
                            resolve(result);
                        }
                    );
                },
                error,
                options
                );
                
            });
        } else {

            console.log("Geolocation is not supported by this browser.");
        }
    }
    //,
    //GetDeviceLocation: function getDeviceLocation() {
    //    if (navigator.geolocation) {
    //        navigator.geolocation.getCurrentPosition(showLocation, error, options);
    //    } else {
    //        console.log("Geolocation is not supported by this browser.");
    //    }
    //}
}
function error(err) {
    //if ('@ViewBag.LocationMandatoryInDirectOrder' == 'Y') {
    //    alert('Please on your location');
    //    window.location = "@BaseURL/HomeNew/Index";
    //}
    console.warn(`ERROR(${err.code}): ${err.message}`);
}

export { BizSolGeoLocation }