function logoutUser() {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = "https://" + window.location.host +"/erp";
}
window.logoutUser = logoutUser;
