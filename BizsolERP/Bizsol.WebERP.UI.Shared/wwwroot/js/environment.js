 const environment = {
     //BASE_URL: window.location.href.toLowerCase().includes('erp25test') == true ? 'https://' + window.location.hostname + '/erp25apitest/api' : window.location.href.toLowerCase().includes('test') == true ? 'https://web.bizsol.in/erpapitest/api' : window.location.href.toLowerCase().includes('dev') == true || window.location.href.toLowerCase().includes('localhost') == true ? 'https://web.bizsol.in/erpapidev/api' : 'https://' + window.location.hostname + '/erp25api/api'  // development API
    //BASE_URL: window.location.href.toLowerCase().includes('erp25test') == true ? 'https://' + window.location.hostname + '/erp25apitest/api' : window.location.href.toLowerCase().includes('dev') == true || window.location.href.toLowerCase().includes('localhost') == true ? 'https://web.bizsol.in/erpapidev/api' : 'https://' + window.location.hostname + '/erp25api/api'  // development API
   //  BASE_URL: 'https://salpapers.bizsol.in/erp25api/api'  // development API
    // BASE_URL: 'https://192.168.1.208/erp25api/api'  // development API
    // BASE_URL: 'http://localhost:5088/api'  // development API
    //BASE_URL: 'https://salpapers.bizsol.in/erp25api/api'  // development API
    // Get BASE_URL from sessionStorage (set by the server in _Layout.cshtml), fallback to localhost
    // If localhost is detected, ensure port 5088 is used
    BASE_URL: (() => {
        let appBaseUrl = sessionStorage.getItem('AppBaseURL');
        let baseUrl = appBaseUrl ? appBaseUrl + 'api' : 'http://localhost:5088';
        // If it contains localhost, ensure it uses port 5088
        if (baseUrl.toLowerCase().includes('localhost')) {
            // Replace any existing port with 5088
            baseUrl = baseUrl.replace(/localhost(:\d+)?/, 'localhost:5088');
            baseUrl = baseUrl.replace(/api/, '');
        }
        return baseUrl + '/api';
    })()
};

$.ajaxSetup({
    headers: { "auth-key": sessionStorage.getItem('authKey') }
});

export { environment }