function callApi(method, url, data, headers) {
    return $.ajax({
        type: method || "POST",
        url: url,
        data: data || {},
        headers: headers || {},
        dataType: "json"
    });
}

function getSafeApiUrl(url) {
    if (window.location.protocol === "https:" && /^http:\/\//i.test(url)) {
        return url.replace(/^http:\/\//i, "https://");
    }
    return url;
}

function CheckGSTNStatus(apiConfig, gstNoToSearch, accountDesp) {
    if (!apiConfig || !apiConfig.APIUrl) {
        return $.Deferred().reject("GST API configuration not found.").promise();
    }

    var payload = {
        GSTIN: apiConfig.GSTIN || "",
        SearchGSTIN: gstNoToSearch || apiConfig.SearchGSTIN || "",
        EFUserName: apiConfig.EFUserName || "",
        EFPassword: apiConfig.EFPassword || "",
        CDKey: apiConfig.CDKey || "",
        EWBUserName: apiConfig.EWBUserName || "",
        EWBPassword: apiConfig.EWBPassword || ""
    };

    return $.ajax({
        type: "POST",
        url: getSafeApiUrl(apiConfig.APIUrl),
        data: JSON.stringify(payload),
        contentType: "application/json; charset=utf-8",
        dataType: "json"
    });
}

export { callApi, CheckGSTNStatus };