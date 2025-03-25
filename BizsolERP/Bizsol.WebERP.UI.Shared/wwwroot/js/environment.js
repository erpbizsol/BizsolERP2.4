 const environment = {
   BASE_URL: window.location.href.toLowerCase().includes('erp25test') == true ? 'https://' + window.location.hostname + '/erp25apitest/api' : window.location.href.toLowerCase().includes('test') == true ? 'https://web.bizsol.in/erpapitest/api' : window.location.href.toLowerCase().includes('dev') == true || window.location.href.toLowerCase().includes('localhost') == true ? 'https://web.bizsol.in/erpapidev/api' : 'https://' + window.location.hostname + '/erp25api/api'  // development API
     //BASE_URL: window.location.href.toLowerCase().includes('erp25test') == true ? 'https://' + window.location.hostname + '/erp25apitest/api' : window.location.href.toLowerCase().includes('dev') == true || window.location.href.toLowerCase().includes('localhost') == true ? 'https://web.bizsol.in/erpapidev/api' : 'https://' + window.location.hostname + '/erp25api/api'  // development API
   //  BASE_URL: 'https://salpapers.bizsol.in/erp25api/api'  // development API
    // BASE_URL: 'https://192.168.1.208/erp25api/api'  // development API
  //BASE_URL: 'http://localhost:5088/api'  // development API
    //BASE_URL: 'https://salpapers.bizsol.in/erp25api/api'  // development API
};

$.ajaxSetup({
    headers: { "auth-key": sessionStorage.getItem('authKey') }
});

export { environment }