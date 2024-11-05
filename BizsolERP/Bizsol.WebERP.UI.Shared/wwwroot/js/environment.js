 const environment = {
   BASE_URL: window.location.href.includes('test') == true ? 'https://web.bizsol.in/erpapitest/api' : window.location.href.includes('dev') == true || window.location.href.includes('localhost') == true ? 'https://web.bizsol.in/erpapidev/api' : 'https://' + window.location.hostname + '/erpapi/api'  // development API
};

$.ajaxSetup({
    headers: { "auth-key": sessionStorage.getItem('authKey') }
});

export { environment }