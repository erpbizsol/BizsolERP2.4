function cleanModuleDespForFormType(moduleDesp) {
    var text = String(moduleDesp || '').trim();
    if (!text) return '';

    var slashParts = text.split(/\s+\/\s+/);
    if (slashParts.length > 1) {
        text = slashParts[0].trim();
    }

    text = text.replace(/\s+in\s+grid\s*$/i, '').trim();
    return text;
}

/** Compact key from menu ModuleDesp when URL/FormToOpen has no FormType (no static list). */
export function moduleDespToFormType(moduleDesp) {
    if (!moduleDesp) return '';
    var text = cleanModuleDespForFormType(moduleDesp);
    return text.replace(/[\s/]+/g, '');
}

/** Strip quotes/whitespace; FormType value is used as-is from URL or DB. */
export function stripFormTypeQuotes(value) {
    if (!value) return '';
    return String(value).trim().replace(/^['"]+|['"]+$/g, '');
}

/** Read FormType from FormToOpen path query (e.g. ...?FormType='FrmDistributorItemWise'). */
export function parseFormTypeFromFormToOpen(formToOpen) {
    var path = String(formToOpen || '');
    var qIndex = path.indexOf('?');
    if (qIndex === -1) return '';

    var params = new URLSearchParams(path.substring(qIndex + 1));
    return stripFormTypeQuotes(params.get('FormType') || params.get('formtype') || '');
}

/**
 * Resolve FormType from page URL query params.
 * FormType query param is dynamic (used as-is after stripping quotes).
 * ModuleDesp is fallback only when FormType is missing.
 */
export function getOrderLoadFormTypeFromQuery(formTypeParam, moduleDespParam) {
    var formType = stripFormTypeQuotes(formTypeParam);
    if (formType) {
        return formType;
    }

    if (moduleDespParam) {
        return moduleDespToFormType(moduleDespParam) || '';
    }

    return '';
}

/** Build menu/page query string for OrderLoadReport routes. */
export function buildOrderLoadReportMenuQuery(formToOpen, moduleDesp) {
    var qs = 'ModuleDesp=' + encodeURIComponent(moduleDesp || '');
    if (formToOpen && formToOpen.indexOf('OrderLoadReport') !== -1) {
        var formType = parseFormTypeFromFormToOpen(formToOpen);
        if (!formType) {
            formType = moduleDespToFormType(moduleDesp);
        }
        if (formType) {
            qs += '&FormType=' + encodeURIComponent(formType);
        }
    }
    return qs;
}

export function buildOrderLoadReportMenuHref(baseUrl, formToOpen, moduleDesp) {
    var path = String(formToOpen || '').replace(/^\/+/, '');
    var qIndex = path.indexOf('?');
    if (qIndex !== -1) {
        path = path.substring(0, qIndex);
    }
    return baseUrl + '/' + path + '?' + buildOrderLoadReportMenuQuery(formToOpen, moduleDesp);
}
