export const promiseAjaxCallApi = {
    CallAPI: function CallAPI(callMethod, URl, Data) {

        return new Promise(function (resolve, reject) {
            $.ajax({
                url: URl,
                method: callMethod,
                // async: false, 
                // headers: { 'x-my-custom-header': 'some value' },
                contentType: 'application/json',
                data: Data,
                dataType: 'json',
                success: function (response) {
                    resolve(response);
                    //if (response.status === "Success") {
                    //    resolve(response);

                    //} else if (response.message == 'No Record Found') {
                    //    alert("Error: No Record Found");
                    //}
                    //else if (response.length > 0) {
                    //    //console.log(response);
                    //    //return response;
                    //    resolve(response);
                    //}
                    //else {
                    //    alert("Error: " + response.message);
                    //}
                },
                error: function (xhr, status, error) {
                    var errorMessage = status + ': ' + error;
                    alert('Data Error: ' + errorMessage);
                }
            });
        });


    },
    CallAPIasBlobObj: function CallAPIasBlobObj(callMethod, URl, Data) {

        return new Promise(function (resolve, reject) {
            $.ajax({
                url: URl,
                method: callMethod,
                contentType: 'application/json',
                data: Data,
                //dataType: 'json',
                xhrFields: {
                    responseType: 'blob'
                },
                success: function (response) {
                    resolve(response);

                },
                error: function (xhr, status, error) {
                    var errorMessage = status + ': ' + error;
                    alert('Data Error: ' + errorMessage);
                }
            });
        });


    }
}