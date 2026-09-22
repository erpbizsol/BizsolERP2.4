import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

function asList(value) {
    if (Array.isArray(value)) return value;
    if (value == null) return [];
    return [value];
}

function normalizeImportCellValue(value) {
    if (value == null || value === undefined) return '';
    return value;
}

function normalizeImportRow(row) {
    var out = {};
    if (!row || typeof row !== 'object') return out;

    Object.keys(row).forEach(function (key) {
        if (String(key).toLowerCase() === 'rowno') return;
        out[key] = normalizeImportCellValue(row[key]);
    });
    return out;
}

function parseImportRowsJson(importRowsJson) {
    if (importRowsJson == null || importRowsJson === '') return [];
    if (Array.isArray(importRowsJson)) return importRowsJson;

    try {
        var parsed = JSON.parse(importRowsJson);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

function parseImportRowsFromSaveResponse(response) {
    if (!response || typeof response !== 'object') return [];

    var json = response.ImportRowsJson || response.importRowsJson;
    if (json != null && json !== '') {
        return parseImportRowsJson(json).map(normalizeImportRow);
    }

    return asList(response.ImportRows || response.importRows).map(normalizeImportRow);
}

function normalizeSaveImportResponse(response) {
    if (!response || typeof response !== 'object') return response || {};
    var normalized = Object.assign({}, response);
    normalized.ImportRows = parseImportRowsFromSaveResponse(response);
    return normalized;
}

const ImportExportService = {

    GetImportTemplateConfigurationList: function GetImportTemplateConfigurationList() {
        var URL = UrlService.API_ENDPOINT_IMPORT_EXPORT + '/GetImportTemplateConfigurationList';
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    GetImportTemplateColumns: function GetImportTemplateColumns(importExportTemplateConfigurationCode) {
        var URL = UrlService.API_ENDPOINT_IMPORT_EXPORT
            + '/GetImportTemplateColumns?ImportExportTemplateConfiguration_Code='
            + encodeURIComponent(importExportTemplateConfigurationCode || 0);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    SaveImportMasterData: function SaveImportMasterData(payload) {
        var URL = UrlService.API_ENDPOINT_IMPORT_EXPORT + '/SaveImportMasterData';
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(payload || {})).then(function (value) {
            return normalizeSaveImportResponse(value);
        });
    },

    normalizeImportCellValue: normalizeImportCellValue,
    normalizeImportRow: normalizeImportRow,
    parseImportRowsJson: parseImportRowsJson,
    parseImportRowsFromSaveResponse: parseImportRowsFromSaveResponse
};

export { ImportExportService };
