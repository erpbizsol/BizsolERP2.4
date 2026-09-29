import { UserDashboardMenuService } from './JSServices/UserDashboardMenuService.js';

function firstArray(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (payload.$values && Array.isArray(payload.$values)) return payload.$values;
    if (payload.data && Array.isArray(payload.data)) return payload.data;
    if (payload.Data && Array.isArray(payload.Data)) return payload.Data;
    if (payload.value && Array.isArray(payload.value)) return payload.value;
    if (payload.Value && Array.isArray(payload.Value)) return payload.Value;
    if (payload.result && Array.isArray(payload.result)) return payload.result;
    if (payload.Result && Array.isArray(payload.Result)) return payload.Result;
    if (payload.Table && Array.isArray(payload.Table)) return payload.Table;
    if (payload.table && Array.isArray(payload.table)) return payload.table;
    if (payload.data && payload.data.$values && Array.isArray(payload.data.$values)) return payload.data.$values;
    if (payload.Data && payload.Data.$values && Array.isArray(payload.Data.$values)) return payload.Data.$values;
    return [];
}

function normalizeDesp(text) {
    return (text || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
}

function pickDesp(item) {
    if (!item) return '';
    var text = item.Desp != null ? item.Desp
        : (item.desp != null ? item.desp
            : (item.TileDesp != null ? item.TileDesp
                : (item.Name != null ? item.Name : item.name)));
    return (text || '').toString().trim();
}

function pickTileCode(item) {
    if (!item) return '';
    var code = item.WebApiDashboardTileDetail_Code != null ? item.WebApiDashboardTileDetail_Code
        : (item.webApiDashboardTileDetail_Code != null ? item.webApiDashboardTileDetail_Code
            : (item.DashboardTileDetail_Code != null ? item.DashboardTileDetail_Code
                : (item.Code != null ? item.Code : item.code)));
    return code != null ? String(code).trim() : '';
}

function getDashboardMasterCodeFromUrl() {
    try {
        var params = new URLSearchParams(window.location.search || '');
        return (
            params.get('DashboardMaster_Code') ||
            params.get('dashboardMaster_Code') ||
            params.get('WebApiDashboardMaster_Code') ||
            ''
        ).toString().trim();
    } catch (e) {
        return '';
    }
}

function markRightsReady(root) {
    var scope = root && root.querySelector ? root : document;
    var wrap = scope.querySelector('.pdd-wrap') || document.querySelector('.pdd-wrap');
    if (wrap) wrap.classList.add('pdd-rights-ready');
}

const UserDashboardTileRights = {
    _hiddenDesps: {},
    _hiddenCodes: {},
    _loadPromise: null,

    IsTileHidden: function IsTileHidden(despOrCode) {
        if (despOrCode == null || despOrCode === '') return false;
        var despKey = normalizeDesp(despOrCode);
        var codeKey = String(despOrCode).trim();
        return !!(despKey && this._hiddenDesps[despKey]) || !!(codeKey && this._hiddenCodes[codeKey]);
    },

    Apply: function Apply(root) {
        var self = this;
        var scope = root && root.querySelectorAll ? root : document;

        var applyToDom = function () {
            var nodes = scope.querySelectorAll('[data-tile-desp], [data-tile-code]');
            nodes.forEach(function (el) {
                var desp = el.getAttribute('data-tile-desp') || '';
                var code = el.getAttribute('data-tile-code') || '';
                var hidden = self.IsTileHidden(desp) || (code ? self.IsTileHidden(code) : false);
                el.classList.toggle('pdd-tile-hidden', hidden);
                if (hidden) {
                    el.setAttribute('aria-hidden', 'true');
                } else {
                    el.removeAttribute('aria-hidden');
                }
            });
            markRightsReady(scope);
        };

        if (self._loadPromise) {
            return self._loadPromise.then(applyToDom).catch(applyToDom);
        }

        var dashboardCode = getDashboardMasterCodeFromUrl();
        var userCode = UserDashboardMenuService.GetLoggedInUserMasterCode();

        if (!dashboardCode || !userCode) {
            applyToDom();
            return Promise.resolve();
        }

        self._loadPromise = UserDashboardMenuService
            .GetUserDashboardConfiguration(dashboardCode, userCode)
            .then(function (res) {
                self._hiddenDesps = {};
                self._hiddenCodes = {};
                firstArray(res).forEach(function (row) {
                    var desp = normalizeDesp(pickDesp(row));
                    var code = pickTileCode(row);
                    if (desp) self._hiddenDesps[desp] = true;
                    if (code && code !== '0') self._hiddenCodes[code] = true;
                });
            })
            .catch(function (err) {
                console.error('GetUserDashboardConfiguration failed', err);
                self._hiddenDesps = {};
                self._hiddenCodes = {};
            });

        return self._loadPromise.then(applyToDom).catch(applyToDom);
    },
};

export { UserDashboardTileRights };
