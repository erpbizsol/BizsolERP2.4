import { RollingPlanSheetService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_RollingPlanSheetService.js';
var baseUrl = sessionStorage.getItem('AppBaseURL');
$(document).ready(function () {
    try {
        const qs = window.location.search || '';
        const usp = new URLSearchParams(qs);
        let t = usp.get('token') || '';
        if (!t && qs.startsWith('?') && qs.length > 1) {
            t = qs.substring(1);
        }
        window.PAGE_TOKEN = (t || '').toString();
    } catch { window.PAGE_TOKEN = ''; }
});

function Save_SignUp() {
    const Username = ($('#username').val() || '').toString().trim();
    const MobileNo = ($('#MobileNo').val() || '').toString().trim();
    const Email = ($('#Email').val() || '').toString().trim();
    const Password = ($('#password').val() || '').toString();

    if (!Username || !MobileNo || !Email || !Password) {
        alert('Please fill all required fields.');
        return false;
    }

    // Mobile must be exactly 10 digits (adjust per your rules)
    const mobileOk = /^[0-9]{10}$/.test(MobileNo);
    if (!mobileOk) {
        alert('Please enter a valid 10 digit mobile number.');
        $('#MobileNo').focus();
        return false;
    }

    // Basic email validation
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(Email);
    if (!emailOk) {
        alert('Please enter a valid email address.');
        $('#Email').focus();
        return false;
    }

    const token = (window.PAGE_TOKEN || '').toString();
    const Json = { Username, MobileNo, Email, Password };

    const payload = {
        token: token,
        Json: JSON.stringify(Json)
    };
    RollingPlanSheetService.SaveData(payload).then(function (response) {
        if (response && (response.Status === 'Y' || response.ok === true)) {
            window.location.href = `/erp25test/ProductionTransactions/RollingPlanSheet/Verified`;
        } else {
            alert(response && response.Message ? response.Message : 'Error during sign up');
        }
    })
}

window.Save_SignUp = Save_SignUp;
