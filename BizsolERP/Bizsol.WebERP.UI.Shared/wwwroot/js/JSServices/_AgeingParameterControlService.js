import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

function _unwrapAgeingResponse(raw) {
    if (raw == null) return raw;
    if (raw.data !== undefined) return raw.data;
    if (raw.Data !== undefined) return raw.Data;
    return raw;
}

function _normalizeSavedFormatList(raw) {
    const unwrapped = _unwrapAgeingResponse(raw);
    const list = Array.isArray(unwrapped) ? unwrapped : [];
    return list.map(function (item) {
        const desp = item != null && item.Desp !== undefined ? item.Desp : item && item.desp;
        return { Desp: desp == null ? '' : String(desp) };
    });
}

function _normalizeFormatDetail(raw) {
    const payload = _unwrapAgeingResponse(raw);
    if (!payload) {
        return { Desp: '', Rows: [] };
    }
    let rowArr = payload.Rows || payload.rows;
    if (!rowArr && Array.isArray(payload)) {
        rowArr = payload;
    }
    if (!Array.isArray(rowArr)) {
        return { Desp: '', Rows: [] };
    }
    const desp = payload.Desp !== undefined ? payload.Desp : payload.desp;
    const Rows = rowArr.map(function (r) {
        const days = r != null && r.Days !== undefined ? r.Days : r && r.days;
        const daysDesp = r != null && r.DaysDesp !== undefined ? r.DaysDesp : r && r.daysDesp;
        return {
            Days: days !== undefined && days !== null ? Number(days) : 0,
            DaysDesp: daysDesp != null ? String(daysDesp) : '',
        };
    });
    return {
        Desp: desp == null ? '' : String(desp),
        Rows: Rows,
    };
}

const AgeingParameterControlService = {

    GetSavedFormatList: function GetSavedFormatList(formName, formType) {
        let url = UrlService.API_ENDPOINT_AgeingParameter
            + '/GetSavedFormatList'
            + '?FormName=' + encodeURIComponent(formName || '')
            + '&FormType=' + encodeURIComponent(formType || '');
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(_normalizeSavedFormatList);
    },

    GetFormatDetail: function GetFormatDetail(desp, formName, formType) {
        let url = UrlService.API_ENDPOINT_AgeingParameter
            + '/GetFormatDetail'
            + '?Desp='     + encodeURIComponent(desp     || '')
            + '&FormName=' + encodeURIComponent(formName || '')
            + '&FormType=' + encodeURIComponent(formType || '');
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(_normalizeFormatDetail);
    },

    SaveFormat: function SaveFormat(payload) {
        let url = UrlService.API_ENDPOINT_AgeingParameter + '/SaveFormat';
        const gridRows = payload && payload.Rows ? payload.Rows : [];
        const body = gridRows.map(function (row, idx) {
            const item = {
                desp: payload.Desp,
                days: row.Days,
                daysDesp: row.DaysDesp,
                formType: payload.FormType,
                formName: payload.FormName,
            };
            if (payload.DR_CR != null && payload.DR_CR !== '') {
                item.drCr = payload.DR_CR;
            }
            if (idx === 0 && payload.TempDesp) {
                item.tempDesp = payload.TempDesp;
            }
            return item;
        });
        return promiseAjaxCallApi.CallAPI('POST', url, JSON.stringify(body)).then(function (v) { return v; });
    },

    DeleteFormat: function DeleteFormat(desp, formName, formType) {
        let url = UrlService.API_ENDPOINT_AgeingParameter
            + '/DeleteFormat'
            + '?Desp='     + encodeURIComponent(desp     || '')
            + '&FormName=' + encodeURIComponent(formName || '')
            + '&FormType=' + encodeURIComponent(formType || '');
        return promiseAjaxCallApi.CallAPI('DELETE', url, '').then(function (v) { return v; });
    },
};

export { AgeingParameterControlService };
