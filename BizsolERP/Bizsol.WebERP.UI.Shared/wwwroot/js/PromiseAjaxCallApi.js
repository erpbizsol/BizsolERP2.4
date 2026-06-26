export const promiseAjaxCallApi = {
    CallAPI: function CallAPI(callMethod, URl, Data, options) {
        options = options || {};
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
                    
                },
                error: function (xhr, status, error) {
                    const errorMessage = `${status}: ${error}`;

                    if (!options.suppressErrorToast) {
                        toastr.error('Data Error : ' + errorMessage + ' ON API:' + new URL(URl).pathname);
                    }
                    reject({ message: errorMessage, xhr: xhr, status: status });
                    HideLoader();
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
                   // alert('Data Error: ' + errorMessage);
                    toastr.error('Data Error: ' + errorMessage + ' ON API:' + new URL(URl).pathname);
                }
            });
        });


    }
}