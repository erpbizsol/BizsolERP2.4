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
            svg: 'image/svg+xml'
        };
        return map[fileExt(fileName)] || '';
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
            '#' + VIEWER_ID + ' .bizsol-file-body{flex:1;min-height:0;background:#111827;position:relative;overflow:auto;-webkit-overflow-scrolling:touch;}' +
            '#' + VIEWER_ID + ' #bizsolFileViewerImg{display:none;width:100%;height:100%;object-fit:contain;background:#111;}' +
            '#' + VIEWER_ID + ' #bizsolFileViewerFrame{display:none;width:100%;height:100%;border:0;background:#fff;}' +
            '#' + VIEWER_ID + ' #bizsolFileViewerPages{display:none;padding:8px;box-sizing:border-box;}' +
            '#' + VIEWER_ID + ' #bizsolFileViewerPages canvas{display:block;width:100%;height:auto;margin:0 auto 8px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.25);}' +
            '#' + VIEWER_ID + ' #bizsolFileViewerText{display:none;margin:0;padding:16px;color:#e5e7eb;white-space:pre-wrap;word-break:break-word;font-size:13px;}' +
            '#' + VIEWER_ID + ' .bizsol-file-fallback{display:none;padding:32px 16px;text-align:center;color:#eee;}' +
            '#' + VIEWER_ID + ' .bizsol-file-fallback p{margin:0 0 16px;font-size:14px;line-height:1.45;}' +
            '#' + VIEWER_ID + ' .bizsol-file-openbtn{display:inline-block;min-height:42px;line-height:42px;padding:0 18px;border-radius:8px;background:#4f46e5;color:#fff;text-decoration:none;font-size:14px;font-weight:600;}' +
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
                '</div>' +
                '<div class="bizsol-file-body">' +
                '  <img id="bizsolFileViewerImg" alt="File preview" />' +
                '  <iframe id="bizsolFileViewerFrame" title="File preview"></iframe>' +
                '  <div id="bizsolFileViewerPages"></div>' +
                '  <pre id="bizsolFileViewerText"></pre>' +
                '  <div class="bizsol-file-fallback" id="bizsolFileViewerFallback">' +
                '    <p>Unable to preview this file.</p>' +
                '    <a class="bizsol-file-openbtn" id="bizsolFileViewerOpen" href="#" download>Download file</a>' +
                '  </div>' +
                '</div>';
            document.body.appendChild(overlay);
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
        return overlay;
    }

    function showFallback(url, fileName) {
        hidePreviewNodes();
        var fallback = document.getElementById('bizsolFileViewerFallback');
        var openBtn = document.getElementById('bizsolFileViewerOpen');
        if (fallback) {
            fallback.style.display = 'block';
        }
        if (openBtn) {
            openBtn.setAttribute('href', url);
            openBtn.setAttribute('download', fileName || 'file');
            openBtn.textContent = 'Download file';
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
            callback(url, false);
            return;
        }
        fetch(url).then(function (response) {
            return response.blob();
        }).then(function (blob) {
            var typed = (blob && blob.type && blob.type !== 'application/octet-stream' && blob.type !== '')
                ? blob
                : new Blob([blob], { type: mime });
            callback(URL.createObjectURL(typed), true);
        }).catch(function () {
            callback(url, false);
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

        withTypedBlobUrl(url, title, function (nextUrl, created) {
            if (created) {
                if (options.ownUrl && url && url !== nextUrl) {
                    try {
                        URL.revokeObjectURL(url);
                    } catch (e) { }
                }
                ownedUrl = nextUrl;
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

    window.openInAppViewer = openInAppViewer;
    window.closeInAppViewer = function () {
        closeInAppViewer(false);
    };
})();
