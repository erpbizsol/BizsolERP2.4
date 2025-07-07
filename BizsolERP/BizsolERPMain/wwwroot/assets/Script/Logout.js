function logoutUser() {
    sessionStorage.clear();
    window.location.href = "https://" + window.location.host +"/erp";
}
window.logoutUser = logoutUser;
