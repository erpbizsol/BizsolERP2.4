var API_END_URL = "/EmployeeMaster";
var UserMaster_Code = 145;
function GetEmployeeMasterList(EmployeeStatus) {
    var URL = API_END_URL + "/GetEmployeeMasterList?EmployeeStatus=" + EmployeeStatus;
    return CallAPI('GET', URL, Data);
}


function CallAPI(callMethod, URl, Data) {
    $.ajax({
        url: URl,
        method: callMethod,
        contentType: 'application/json',
        data: Data,
        dataType: 'json',
        success: function (response) {

            if (response.status === "Success") {
                return response.jobConfigurationDetails;

            } else if (response.message == 'No Record Found') {
                alert("Error: No Record Found");
            }
            else {
                alert("Error: " + response.message);
            }
        },
        error: function (xhr, status, error) {
            var errorMessage = status + ': ' + error;
            alert('Data Error: ' + errorMessage);
        }
    });

}