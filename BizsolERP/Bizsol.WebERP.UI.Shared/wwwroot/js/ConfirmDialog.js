(function () {
    var ua = navigator.userAgent || '';
    var isIOS = /iPad|iPhone|iPod/i.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (!isIOS || window.__bizsolConfirmOverridden) {
        return;
    }
    window.__bizsolConfirmOverridden = true;

    var nativeConfirm = window.confirm;
    window.confirm = function (message, title) {
        if (!document.body) {
            return nativeConfirm.call(window, message);
        }
        return new Promise(function (resolve) {
            var OVERLAY_ID = 'bizsolConfirmOverlay';
            var STYLE_ID = 'bizsolConfirmStyle';
            var overlay = document.getElementById(OVERLAY_ID);

            if (!document.getElementById(STYLE_ID)) {
                var style = document.createElement('style');
                style.id = STYLE_ID;
                style.textContent =
                    '#' + OVERLAY_ID + '{display:none;position:fixed;top:0;right:0;bottom:0;left:0;z-index:20000;align-items:center;justify-content:center;padding:16px;padding-bottom:calc(16px + env(safe-area-inset-bottom,0px));}' +
                    '#' + OVERLAY_ID + '.bizsol-confirm-open{display:-webkit-flex;display:flex;}' +
                    '#' + OVERLAY_ID + ' .bizsol-confirm-backdrop{position:absolute;top:0;right:0;bottom:0;left:0;background:rgba(0,0,0,.45);}' +
                    '#' + OVERLAY_ID + ' .bizsol-confirm-box{position:relative;background:#fff;border-radius:8px;width:92%;max-width:360px;box-shadow:0 8px 24px rgba(0,0,0,.25);overflow:hidden;-webkit-transform:translateZ(0);}' +
                    '#' + OVERLAY_ID + ' .bizsol-confirm-header{background:#558bc0;color:#fff;font-weight:600;padding:10px 14px;}' +
                    '#' + OVERLAY_ID + ' .bizsol-confirm-body{padding:16px 14px;font-size:14px;color:#2c3e50;line-height:1.4;white-space:pre-wrap;}' +
                    '#' + OVERLAY_ID + ' .bizsol-confirm-footer{padding:10px 14px 14px;display:-webkit-flex;display:flex;justify-content:flex-end;gap:8px;}' +
                    '#' + OVERLAY_ID + ' .bizsol-confirm-footer .btn{min-width:72px;min-height:44px;-webkit-tap-highlight-color:transparent;}';
                document.head.appendChild(style);
            }

            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = OVERLAY_ID;
                overlay.innerHTML =
                    '<div class="bizsol-confirm-backdrop"></div>' +
                    '<div class="bizsol-confirm-box" role="dialog" aria-modal="true">' +
                    '  <div class="bizsol-confirm-header">Confirm</div>' +
                    '  <div class="bizsol-confirm-body" id="bizsolConfirmMsg"></div>' +
                    '  <div class="bizsol-confirm-footer">' +
                    '    <button type="button" class="btn btn-secondary btn-sm" id="bizsolConfirmCancel">Cancel</button>' +
                    '    <button type="button" class="btn btn-primary btn-sm" id="bizsolConfirmOk">OK</button>' +
                    '  </div>' +
                    '</div>';
                document.body.appendChild(overlay);
            }

            var msgEl = document.getElementById('bizsolConfirmMsg');
            if (msgEl) {
                msgEl.textContent = message || '';
            }
            var header = overlay.querySelector('.bizsol-confirm-header');
            if (header) {
                header.textContent = title || 'Confirm';
            }

            var settled = false;
            var previousOverflow = document.body.style.overflow;
            var onKeyDown;
            var finish = function (ok) {
                if (settled) {
                    return;
                }
                settled = true;
                document.removeEventListener('keydown', onKeyDown);
                overlay.classList.remove('bizsol-confirm-open');
                overlay.style.display = 'none';
                document.body.style.overflow = previousOverflow;
                resolve(!!ok);
            };
            onKeyDown = function (e) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    finish(false);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    finish(true);
                }
            };

            var okBtn = document.getElementById('bizsolConfirmOk');
            var cancelBtn = document.getElementById('bizsolConfirmCancel');
            var backdrop = overlay.querySelector('.bizsol-confirm-backdrop');
            if (okBtn) {
                okBtn.onclick = function () { finish(true); };
            }
            if (cancelBtn) {
                cancelBtn.onclick = function () { finish(false); };
            }
            if (backdrop) {
                backdrop.onclick = function () { finish(false); };
            }
            document.addEventListener('keydown', onKeyDown);

            document.body.style.overflow = 'hidden';
            overlay.style.display = 'flex';
            overlay.classList.add('bizsol-confirm-open');
        });
    };
})();
