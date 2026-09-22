(function () {
    var VIEWER_ID = 'bizsolFileViewer';
    var STYLE_ID = 'bizsolFileViewerStyle';
    var PDFJS_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    var PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    var ownedUrl = null;
    var previousOverflow = '';
    var renderToken = 0;
    var historyPushed = false;
    var closingFromPopState = false;
    var currentUrl = null;
    var currentFileName = null;
    var currentBlob = null;

    function guessFileName(url) {
        try {
            var path = String(url).split('?')[0];
            var name = path.split('/').pop() || 'File';
            if (/^(blob:|data:)/i.test(name) || name.length > 80) {
                return 'File';
            }
            return decodeURIComponent(name);
        } catch (e) {
            return 'File';
        }
    }

    function fileExt(fileName) {
        return String(fileName || '').split('.').pop().toLowerCase();
    }

    function isIOSClient() {
        var ua = String(navigator.userAgent || navigator.vendor || '');
        if (/iPhone|iPad|iPod/i.test(ua)) return true;
        if (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1) return true;
        return /Macintosh/i.test(ua) && 'ontouchend' in document;
    }

    function isOfficeFile(fileName) {
        return ['xls', 'xlsx', 'csv', 'doc', 'docx'].indexOf(fileExt(fileName)) >= 0;
    }

    function mimeFromFileName(fileName) {
        var map = {
            pdf: 'application/pdf',
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            gif: 'image/gif',
            txt: 'text/plain',
            webp: 'image/webp',
            bmp: 'image/bmp',
            svg: 'image/svg+xml',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            xls: 'application/vnd.ms-excel',
            csv: 'text/csv',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            zip: 'application/zip'
        };
        return map[fileExt(fileName)] || 'application/octet-stream';
    }

    function triggerAnchorDownload(blob, fileName) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName || 'download';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            try { a.remove(); } catch (e) { }
            try { URL.revokeObjectURL(url); } catch (e2) { }
        }, 4000);
    }

    function getCurrentBlob() {
        if (currentBlob) {
            return Promise.resolve(currentBlob);
        }
        if (!currentUrl || typeof fetch !== 'function') {
            return Promise.reject(new Error('No file data to save.'));
        }
        return fetch(currentUrl).then(function (response) {
            return response.blob();
        }).then(function (blob) {
            currentBlob = blob;
            return blob;
        });
    }

    function openBlobInNewView(blob, fileName) {
        // iOS Safari cannot open .xlsx blob URLs — it shows a native error page.
        if (isIOSClient() && isOfficeFile(fileName)) {
            return;
        }
        var url = URL.createObjectURL(blob);
        var opened = null;
        try {
            opened = window.open(url, '_blank');
        } catch (e) {
            opened = null;
        }
        if (!opened) {
            var a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.rel = 'noopener';
            a.download = fileName || 'download';
            document.body.appendChild(a);
            a.click();
            a.remove();
        }
        setTimeout(function () {
            try { URL.revokeObjectURL(url); } catch (e2) { }
        }, 60000);
    }

    function createShareFile(blob, fileName, type) {
        var name = String(fileName || 'download');
        var mime = type == null ? 'application/octet-stream' : type;
        try {
            return new File([blob], name, { type: mime, lastModified: Date.now() });
        } catch (e1) {
            try {
                return new File([blob], name, { type: 'application/octet-stream', lastModified: Date.now() });
            } catch (e2) {
                return blob;
            }
        }
    }

    function tryShareFile(blob, fileName, type) {
        return new Promise(function (resolve, reject) {
            if (typeof navigator.share !== 'function') {
                reject(new Error('Share not supported'));
                return;
            }

            var shareWith = function (file) {
                var payload = { files: [file], title: fileName };
                // Do not require canShare() — iOS often returns false for Excel MIME types
                // even when navigator.share({ files }) still works.
                Promise.resolve(navigator.share(payload)).then(resolve).catch(reject);
            };

            try {
                if (typeof File !== 'function') {
                    reject(new Error('Share not supported'));
                    return;
                }
                shareWith(createShareFile(blob, fileName, type));
            } catch (err) {
                if (blob && typeof blob.arrayBuffer === 'function') {
                    blob.arrayBuffer().then(function (buf) {
                        try {
                            shareWith(new File([buf], fileName, {
                                type: type || 'application/octet-stream',
                                lastModified: Date.now()
                            }));
                        } catch (e2) {
                            reject(e2);
                        }
                    }).catch(reject);
                    return;
                }
                reject(err);
            }
        });
    }

    function shareOrDownloadBlob(blob, fileName) {
        fileName = fileName || currentFileName || 'download';
        var mime = mimeFromFileName(fileName) || 'application/octet-stream';
        if (isIOSClient()) {
            var types = ['application/octet-stream', mime, ''];
            var seq = Promise.reject(new Error('start'));
            types.forEach(function (type) {
                seq = seq.catch(function (err) {
                    if (err && err.name === 'AbortError') {
                        throw err;
                    }
                    return tryShareFile(blob, fileName, type);
                });
            });
            return seq.catch(function (err) {
                if (err && err.name === 'AbortError') {
                    return;
                }
                // Never window.open an Excel blob on iOS — Safari shows an error page.
                showFallback(currentUrl, fileName);
            });
        }
        triggerAnchorDownload(blob, fileName);
        return Promise.resolve();
    }

    function saveCurrentFile(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        getCurrentBlob().then(function (blob) {
            return shareOrDownloadBlob(blob, currentFileName);
        }).catch(function (err) {
            if (err && err.name === 'AbortError') {
                return;
            }
            if (typeof window.toastr !== 'undefined') {
                window.toastr.info('Tap Save / Share, then choose Save to Files.');
            }
        });
    }

    function isImageFile(fileName, url) {
        if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].indexOf(fileExt(fileName)) >= 0) {
            return true;
        }
        return /^data:image\//i.test(String(url || ''));
    }

    function isPdfFile(fileName, url) {
        if (fileExt(fileName) === 'pdf') {
            return true;
        }
        return /\.pdf(\?|#|$)/i.test(String(url || '')) || /^data:application\/pdf/i.test(String(url || ''));
    }

    function isTextFile(fileName) {
        return fileExt(fileName) === 'txt';
    }

    function revokeOwned() {
        if (ownedUrl) {
            try {
                URL.revokeObjectURL(ownedUrl);
            } catch (e) { }
            ownedUrl = null;
        }
    }

    function hidePreviewNodes() {
        var frame = document.getElementById('bizsolFileViewerFrame');
        var img = document.getElementById('bizsolFileViewerImg');
        var fallback = document.getElementById('bizsolFileViewerFallback');
        var pages = document.getElementById('bizsolFileViewerPages');
        var textEl = document.getElementById('bizsolFileViewerText');
        if (frame) {
            frame.src = 'about:blank';
            frame.style.display = 'none';
        }
        if (img) {
            img.removeAttribute('src');
            img.style.display = 'none';
        }
        if (fallback) {
            fallback.style.display = 'none';
        }
        if (pages) {
            pages.innerHTML = '';
            pages.style.display = 'none';
        }
        if (textEl) {
            textEl.textContent = '';
            textEl.style.display = 'none';
        }
    }

    function closeInAppViewer(fromPopState) {
        renderToken += 1;
        var overlay = document.getElementById(VIEWER_ID);
        if (overlay) {
            overlay.style.display = 'none';
            overlay.classList.remove('bizsol-file-open');
            overlay.setAttribute('aria-hidden', 'true');
        }
        hidePreviewNodes();
        revokeOwned();
        currentUrl = null;
        currentFileName = null;
        currentBlob = null;
        document.body.style.overflow = previousOverflow;

        if (historyPushed && !fromPopState) {
            closingFromPopState = true;
            historyPushed = false;
            try {
                history.back();
            } catch (e) { }
            setTimeout(function () { closingFromPopState = false; }, 200);
        } else {
            historyPushed = false;
        }
    }

    function pushViewerHistory() {
        if (historyPushed) {
            return;
        }
        try {
            history.pushState({ bizsolFileViewer: 1 }, '', window.location.href);
            historyPushed = true;
        } catch (e) {
            historyPushed = false;
        }
    }

    function ensureViewer() {
        var css =
            '#' + VIEWER_ID + '{display:none;position:fixed;top:0;right:0;bottom:0;left:0;z-index:20050;background:#1f2937;flex-direction:column;box-sizing:border-box;}' +
            '#' + VIEWER_ID + '.bizsol-file-open{display:-webkit-flex;display:flex;}' +
            '#' + VIEWER_ID + ' .bizsol-file-bar{display:-webkit-flex;display:flex;align-items:center;gap:8px;min-height:44px;padding:8px 10px;padding-top:calc(8px + env(safe-area-inset-top, 0px));background:linear-gradient(90deg,#4f46e5 0%,#6366f1 100%);color:#fff;flex-shrink:0;box-sizing:border-box;}' +
            '#' + VIEWER_ID + ' .bizsol-file-back{display:-webkit-inline-flex;display:inline-flex;align-items:center;justify-content:center;gap:4px;min-width:72px;height:34px;border:1px solid rgba(255,255,255,.6);border-radius:6px;background:rgba(255,255,255,.16);color:#fff;font-size:14px;font-weight:700;line-height:1;padding:0 10px;-webkit-tap-highlight-color:transparent;cursor:pointer;}' +
            '#' + VIEWER_ID + ' .bizsol-file-back:active{background:rgba(255,255,255,.32);}' +
            '#' + VIEWER_ID + ' .bizsol-file-back-icon{font-size:20px;line-height:1;margin-top:-1px;}' +
            '#' + VIEWER_ID + ' .bizsol-file-title{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:600;}' +
            '#' + VIEWER_ID + ' .bizsol-file-save{display:-webkit-inline-flex;display:inline-flex;align-items:center;justify-content:center;min-width:72px;height:34px;border:1px solid rgba(255,255,255,.6);border-radius:6px;background:rgba(255,255,255,.16);color:#fff;font-size:14px;font-weight:700;padding:0 12px;-webkit-tap-highlight-color:transparent;cursor:pointer;}' +
            '#' + VIEWER_ID + ' .bizsol-file-save:active{background:rgba(255,255,255,.32);}' +
            '#' + VIEWER_ID + ' .bizsol-file-body{flex:1;min-height:0;background:#111827;position:relative;overflow:auto;-webkit-overflow-scrolling:touch;}' +
            '#' + VIEWER_ID + ' #bizsolFileViewerImg{display:none;width:100%;height:100%;object-fit:contain;background:#111;}' +
            '#' + VIEWER_ID + ' #bizsolFileViewerFrame{display:none;width:100%;height:100%;border:0;background:#fff;}' +
            '#' + VIEWER_ID + ' #bizsolFileViewerPages{display:none;padding:8px;box-sizing:border-box;}' +
            '#' + VIEWER_ID + ' #bizsolFileViewerPages canvas{display:block;width:100%;height:auto;margin:0 auto 8px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.25);}' +
            '#' + VIEWER_ID + ' #bizsolFileViewerText{display:none;margin:0;padding:16px;color:#e5e7eb;white-space:pre-wrap;word-break:break-word;font-size:13px;}' +
            '#' + VIEWER_ID + ' .bizsol-file-fallback{display:none;padding:32px 16px;text-align:center;color:#eee;}' +
            '#' + VIEWER_ID + ' .bizsol-file-fallback p{margin:0 0 16px;font-size:14px;line-height:1.45;}' +
            '#' + VIEWER_ID + ' .bizsol-file-openbtn{display:inline-block;min-height:42px;line-height:42px;padding:0 18px;border:0;border-radius:8px;background:#4f46e5;color:#fff;text-decoration:none;font-size:14px;font-weight:600;cursor:pointer;-webkit-appearance:none;appearance:none;}' +
            '#' + VIEWER_ID + ' .bizsol-file-loading{padding:24px;text-align:center;color:#fff;font-size:14px;}';

        var style = document.getElementById(STYLE_ID);
        if (!style) {
            style = document.createElement('style');
            style.id = STYLE_ID;
            document.head.appendChild(style);
        }
        style.textContent = css;

        var overlay = document.getElementById(VIEWER_ID);
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = VIEWER_ID;
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.innerHTML =
                '<div class="bizsol-file-bar">' +
                '  <button type="button" class="bizsol-file-back" id="bizsolFileViewerBack">' +
                '    <span class="bizsol-file-back-icon">&#8249;</span><span>Back</span>' +
                '  </button>' +
                '  <div class="bizsol-file-title" id="bizsolFileViewerTitle">File</div>' +
                '  <button type="button" class="bizsol-file-save" id="bizsolFileViewerSave">Save</button>' +
                '</div>' +
                '<div class="bizsol-file-body">' +
                '  <img id="bizsolFileViewerImg" alt="File preview" />' +
                '  <iframe id="bizsolFileViewerFrame" title="File preview"></iframe>' +
                '  <div id="bizsolFileViewerPages"></div>' +
                '  <pre id="bizsolFileViewerText"></pre>' +
                '  <div class="bizsol-file-fallback" id="bizsolFileViewerFallback">' +
                '    <p id="bizsolFileViewerFallbackMsg">Your file is ready. Tap Save / Share, then choose Save to Files.</p>' +
                '    <button type="button" class="bizsol-file-openbtn" id="bizsolFileViewerOpen">Save file</button>' +
                '  </div>' +
                '</div>';
            document.body.appendChild(overlay);
        }

        if (!document.getElementById('bizsolFileViewerSave')) {
            var bar = overlay.querySelector('.bizsol-file-bar');
            var titleNode = document.getElementById('bizsolFileViewerTitle');
            if (bar) {
                var saveBtn = document.createElement('button');
                saveBtn.type = 'button';
                saveBtn.className = 'bizsol-file-save';
                saveBtn.id = 'bizsolFileViewerSave';
                saveBtn.textContent = 'Save';
                if (titleNode && titleNode.parentNode === bar) {
                    bar.appendChild(saveBtn);
                } else {
                    bar.appendChild(saveBtn);
                }
            }
        }
        if (!document.getElementById('bizsolFileViewerFallbackMsg')) {
            var fallbackEl = document.getElementById('bizsolFileViewerFallback');
            if (fallbackEl && !fallbackEl.querySelector('p')) {
                var p = document.createElement('p');
                p.id = 'bizsolFileViewerFallbackMsg';
                fallbackEl.insertBefore(p, fallbackEl.firstChild);
            } else if (fallbackEl) {
                var existingP = fallbackEl.querySelector('p');
                if (existingP) existingP.id = 'bizsolFileViewerFallbackMsg';
            }
        }

        var backEl = document.getElementById('bizsolFileViewerBack');
        if (backEl) {
            backEl.onclick = function (e) {
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                closeInAppViewer(false);
            };
        }
        var saveEl = document.getElementById('bizsolFileViewerSave');
        if (saveEl) {
            saveEl.onclick = saveCurrentFile;
        }
        var openEl = document.getElementById('bizsolFileViewerOpen');
        if (openEl) {
            openEl.onclick = saveCurrentFile;
        }
        return overlay;
    }

    function showFallback(url, fileName) {
        hidePreviewNodes();
        currentUrl = url || currentUrl;
        currentFileName = fileName || currentFileName;
        var fallback = document.getElementById('bizsolFileViewerFallback');
        var openBtn = document.getElementById('bizsolFileViewerOpen');
        var msgEl = document.getElementById('bizsolFileViewerFallbackMsg');
        if (fallback) {
            fallback.style.display = 'block';
        }
        if (msgEl) {
            msgEl.textContent = isOfficeFile(fileName)
                ? 'Your Excel file is ready. Tap Save / Share, then choose Save to Files.'
                : 'This file cannot be previewed here. Tap Save / Share to keep a copy.';
        }
        if (openBtn) {
            openBtn.textContent = isIOSClient() ? 'Save / Share' : 'Save file';
        }
    }

    function loadPdfJs(done) {
        if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
            done();
            return;
        }
        var existing = document.getElementById('bizsolPdfJsScript');
        if (existing) {
            existing.addEventListener('load', function () {
                if (window.pdfjsLib) {
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
                }
                done();
            });
            existing.addEventListener('error', function () {
                done(new Error('PDF engine failed to load'));
            });
            return;
        }
        var script = document.createElement('script');
        script.id = 'bizsolPdfJsScript';
        script.src = PDFJS_SRC;
        script.onload = function () {
            if (window.pdfjsLib) {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
            }
            done();
        };
        script.onerror = function () {
            done(new Error('PDF engine failed to load'));
        };
        document.head.appendChild(script);
    }

    function renderPdfPages(url, fileName, token) {
        var pages = document.getElementById('bizsolFileViewerPages');
        if (!pages || !window.pdfjsLib) {
            showFallback(url, fileName);
            return;
        }
        pages.style.display = 'block';
        pages.innerHTML = '<div class="bizsol-file-loading">Loading preview...</div>';

        fetch(url).then(function (response) {
            return response.arrayBuffer();
        }).then(function (data) {
            if (token !== renderToken) {
                return null;
            }
            return window.pdfjsLib.getDocument({ data: data }).promise;
        }).then(function (pdf) {
            if (!pdf || token !== renderToken) {
                return;
            }
            pages.innerHTML = '';
            var containerWidth = pages.clientWidth || window.innerWidth || 360;
            var dpr = window.devicePixelRatio || 1;
            var renderPage = function (num) {
                if (token !== renderToken || num > pdf.numPages) {
                    return;
                }
                pdf.getPage(num).then(function (page) {
                    if (token !== renderToken) {
                        return;
                    }
                    var unscaled = page.getViewport({ scale: 1 });
                    var fitScale = Math.max(0.5, (containerWidth - 16) / unscaled.width);
                    var viewport = page.getViewport({ scale: fitScale * dpr });
                    var canvas = document.createElement('canvas');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    canvas.style.width = '100%';
                    pages.appendChild(canvas);
                    return page.render({
                        canvasContext: canvas.getContext('2d'),
                        viewport: viewport
                    }).promise.then(function () {
                        renderPage(num + 1);
                    });
                }).catch(function () {
                    if (num === 1 && token === renderToken) {
                        showFallback(url, fileName);
                    }
                });
            };
            renderPage(1);
        }).catch(function () {
            if (token === renderToken) {
                showFallback(url, fileName);
            }
        });
    }

    function showPdfPreview(url, fileName) {
        hidePreviewNodes();
        var token = renderToken;
        loadPdfJs(function (err) {
            if (token !== renderToken) {
                return;
            }
            if (err || !window.pdfjsLib) {
                showFallback(url, fileName);
                return;
            }
            renderPdfPages(url, fileName, token);
        });
    }

    function showTextPreview(url, fileName) {
        hidePreviewNodes();
        var textEl = document.getElementById('bizsolFileViewerText');
        if (!textEl) {
            showFallback(url, fileName);
            return;
        }
        textEl.style.display = 'block';
        textEl.textContent = 'Loading preview...';
        fetch(url).then(function (response) {
            return response.text();
        }).then(function (text) {
            textEl.textContent = text || '';
        }).catch(function () {
            showFallback(url, fileName);
        });
    }

    function showUrlInViewer(url, fileName) {
        hidePreviewNodes();
        var img = document.getElementById('bizsolFileViewerImg');

        if (isImageFile(fileName, url)) {
            if (img) {
                img.onload = function () {
                    img.style.display = 'block';
                };
                img.onerror = function () {
                    showFallback(url, fileName);
                };
                img.style.display = 'block';
                img.src = url;
            }
            return;
        }

        if (isPdfFile(fileName, url)) {
            showPdfPreview(url, fileName);
            return;
        }

        if (isTextFile(fileName)) {
            showTextPreview(url, fileName);
            return;
        }

        showFallback(url, fileName);
    }

    function withTypedBlobUrl(url, fileName, callback) {
        var mime = mimeFromFileName(fileName);
        if (!mime || String(url).indexOf('blob:') !== 0 || typeof fetch !== 'function') {
            callback(url, false, null);
            return;
        }
        fetch(url).then(function (response) {
            return response.blob();
        }).then(function (blob) {
            var typed = (blob && blob.type && blob.type !== 'application/octet-stream' && blob.type !== '')
                ? blob
                : new Blob([blob], { type: mime });
            callback(URL.createObjectURL(typed), true, typed);
        }).catch(function () {
            callback(url, false, null);
        });
    }

    function openInAppViewer(url, fileName, options) {
        if (!url || !document.body) {
            return false;
        }
        options = options || {};
        renderToken += 1;
        var overlay = ensureViewer();
        var title = fileName || guessFileName(url);
        var titleEl = document.getElementById('bizsolFileViewerTitle');
        if (titleEl) {
            titleEl.textContent = title;
        }

        revokeOwned();
        if (options.ownUrl) {
            ownedUrl = url;
        }

        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        overlay.style.display = 'flex';
        overlay.classList.add('bizsol-file-open');
        overlay.setAttribute('aria-hidden', 'false');
        pushViewerHistory();

        currentUrl = url;
        currentFileName = title;
        currentBlob = options.blob || null;

        if (isOfficeFile(title) && currentBlob) {
            showFallback(url, title);
            return true;
        }

        withTypedBlobUrl(url, title, function (nextUrl, created, blob) {
            if (blob) {
                currentBlob = blob;
            }
            if (created) {
                if (options.ownUrl && url && url !== nextUrl) {
                    try {
                        URL.revokeObjectURL(url);
                    } catch (e) { }
                }
                ownedUrl = nextUrl;
                currentUrl = nextUrl;
            }
            showUrlInViewer(nextUrl, title);
        });
        return true;
    }

    window.addEventListener('popstate', function () {
        if (closingFromPopState) {
            return;
        }
        var overlay = document.getElementById(VIEWER_ID);
        if (overlay && overlay.classList.contains('bizsol-file-open')) {
            historyPushed = false;
            closeInAppViewer(true);
        }
    });

    function toUint8(out) {
        if (out instanceof Uint8Array) return out;
        if (out instanceof ArrayBuffer) return new Uint8Array(out);
        return new Uint8Array(out);
    }

    function workbookToExcelBlob(wb) {
        if (typeof XLSX === 'undefined' || typeof XLSX.write !== 'function') {
            throw new Error('Excel library is not available.');
        }
        var out = null;
        try {
            out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        } catch (e1) {
            try {
                var binary = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
                var view = new Uint8Array(binary.length);
                for (var i = 0; i < binary.length; i++) {
                    view[i] = binary.charCodeAt(i) & 0xFF;
                }
                out = view;
            } catch (e2) {
                var b64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
                var raw = atob(b64);
                var view2 = new Uint8Array(raw.length);
                for (var j = 0; j < raw.length; j++) {
                    view2[j] = raw.charCodeAt(j);
                }
                out = view2;
            }
        }
        return new Blob([toUint8(out)], { type: 'application/octet-stream' });
    }

    function normalizeExcelFileName(fileName) {
        var name = String(fileName || 'ExportData').replace(/[\\/:*?"<>|]/g, '_').trim();
        if (!name) name = 'ExportData';
        if (!/\.(xlsx|xls|csv)$/i.test(name)) {
            name += '.xlsx';
        }
        return name;
    }

    function dataUriToBlob(uri) {
        var parts = String(uri).split(',');
        var meta = parts[0] || '';
        var data = parts.slice(1).join(',');
        var isBase64 = /;base64/i.test(meta);
        var bytes = isBase64 ? atob(data) : decodeURIComponent(data);
        var view = new Uint8Array(bytes.length);
        for (var i = 0; i < bytes.length; i++) {
            view[i] = bytes.charCodeAt(i) & 0xFF;
        }
        return new Blob([view], { type: 'application/octet-stream' });
    }

    function downloadExcelBlob(blob, fileName) {
        var fullName = normalizeExcelFileName(fileName);
        if (!blob) {
            return;
        }
        var typed = blob;
        try {
            if (!blob.type || blob.type.indexOf('octet-stream') < 0) {
                typed = new Blob([blob], { type: 'application/octet-stream' });
            }
        } catch (e) {
            typed = blob;
        }
        if (!isIOSClient()) {
            triggerAnchorDownload(typed, fullName);
            return;
        }
        tryShareFile(typed, fullName, 'application/octet-stream').catch(function (err) {
            if (err && err.name === 'AbortError') {
                return;
            }
            return tryShareFile(typed, fullName, mimeFromFileName(fullName)).catch(function (err2) {
                if (err2 && err2.name === 'AbortError') {
                    return;
                }
                var url = URL.createObjectURL(typed);
                openInAppViewer(url, fullName, { ownUrl: true, blob: typed });
            });
        });
    }

    function saveExcelWorkbook(wb, fileName) {
        var fullName = normalizeExcelFileName(fileName);
        var blob = workbookToExcelBlob(wb);
        downloadExcelBlob(blob, fullName);
        return true;
    }

    function installXlsxIosPatch() {
        if (typeof XLSX === 'undefined' || typeof XLSX.writeFile !== 'function') {
            return false;
        }
        if (XLSX.writeFile.__bizsolIosPatched) {
            return true;
        }
        var nativeWriteFile = XLSX.writeFile.bind(XLSX);
        XLSX.writeFile = function (wb, fn, opts) {
            if (isIOSClient()) {
                saveExcelWorkbook(wb, fn);
                return;
            }
            return nativeWriteFile(wb, fn, opts);
        };
        XLSX.writeFile.__bizsolIosPatched = true;
        return true;
    }

    function installTable2ExcelPatch() {
        if (typeof window.jQuery === 'undefined' || !window.jQuery.fn || !window.jQuery.fn.table2excel) {
            return false;
        }
        if (window.jQuery.fn.table2excel.__bizsolIosPatched) {
            return true;
        }
        var nativeTable2Excel = window.jQuery.fn.table2excel;
        window.jQuery.fn.table2excel = function (options) {
            if (!isIOSClient()) {
                return nativeTable2Excel.apply(this, arguments);
            }
            options = options || {};
            var fileName = (options.filename || options.name || 'ExportData') + (options.fileext || '.xlsx');
            var table = this && this[0];
            if (!table) {
                return this;
            }
            try {
                if (typeof XLSX !== 'undefined' && XLSX.utils) {
                    var wb = XLSX.utils.book_new();
                    var ws = XLSX.utils.table_to_sheet(table, { raw: true });
                    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
                    saveExcelWorkbook(wb, String(fileName).replace(/\.xls$/i, '.xlsx'));
                    return this;
                }
            } catch (e) { }
            var html = table.outerHTML || '';
            var blob = new Blob([html], { type: 'application/octet-stream' });
            downloadExcelBlob(blob, fileName);
            return this;
        };
        window.jQuery.fn.table2excel.__bizsolIosPatched = true;
        return true;
    }

    function installExcelDownloadPatches() {
        installXlsxIosPatch();
        installTable2ExcelPatch();
    }

    document.addEventListener('click', function (e) {
        if (!isIOSClient() || !e) {
            return;
        }
        var a = e.target;
        while (a && a.nodeType === 1 && a.tagName !== 'A') {
            a = a.parentNode;
        }
        if (!a || a.tagName !== 'A') {
            return;
        }
        var name = a.getAttribute('download');
        if (!name) {
            return;
        }
        var href = a.href || a.getAttribute('href') || '';
        var looksExcel = /\.(xlsx|xls|csv)$/i.test(name)
            || /spreadsheetml|ms-excel|excel/i.test(href)
            || /application\/vnd\.ms-excel/i.test(href);
        if (!looksExcel || !/^(blob:|data:)/i.test(href)) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        if (href.indexOf('blob:') === 0 && typeof fetch === 'function') {
            fetch(href).then(function (response) {
                return response.blob();
            }).then(function (blob) {
                downloadExcelBlob(blob, name);
            }).catch(function () {
                openInAppViewer(href, name, { ownUrl: false });
            });
            return;
        }
        try {
            downloadExcelBlob(dataUriToBlob(href), name);
        } catch (err) {
            openInAppViewer(href, name, { ownUrl: false });
        }
    }, true);

    installExcelDownloadPatches();
    var patchTries = 0;
    var patchTimer = setInterval(function () {
        patchTries += 1;
        installExcelDownloadPatches();
        if (patchTries > 40) {
            clearInterval(patchTimer);
        }
    }, 250);

    window.openInAppViewer = openInAppViewer;
    window.closeInAppViewer = function () {
        closeInAppViewer(false);
    };
    window.bizsolDownloadExcelBlob = downloadExcelBlob;
    window.bizsolSaveExcelWorkbook = saveExcelWorkbook;
})();
