var options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
};

function GetActualLocation() {

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showLocation, error, options);
    } else {
        console.log("Geolocation is not supported by this browser.");
    }
}
function error(err) {
    if ('@ViewBag.LocationMandatoryInDirectOrder' == 'Y') {
        alert('Please on your location');
        window.location = "@BaseURL/HomeNew/Index";
    }
    console.warn("ERROR(${err.code}): ${err.message}");
}
function showLocation(position) {
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;
    var latlong = "Latitude: " + latitude + " Longitude: " + longitude;
    $("#hflatlong").val(latlong);
    var googleAutoNo = "AIzaSyDFJGPvni-6MUITB8MxeHUMI4JfJjP5VJ4";
    var Address = '';
    document.getElementById("txtCurrentLocation").value = '';

    $.ajax({
        url: 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + latitude + ',' + longitude + '&key=' + googleAutoNo + '',
        type: 'get',
        dataType: 'json',
        success: function (response) {

            Address = JSON.stringify(response.results[0].formatted_address);
            Address = Address.replaceAll('"', '');
            document.getElementById("txtCurrentLocation").value = Address;
            if ('@ViewBag.OrderEntryType' != 'V') {
                document.getElementById("txtLocationOrderTypeO").value = Address;
            }
        },
        error: function (xhr) {
            Address = '';
            document.getElementById("txtCurrentLocation").value = Address;

        }
    });
};