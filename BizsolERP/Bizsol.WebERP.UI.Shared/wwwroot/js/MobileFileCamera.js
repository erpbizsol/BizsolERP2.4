(function () {
    var activeInput = null;
    var cameraStream = null;
    var openToken = 0;

    function isIosDevice() {
        var ua = navigator.userAgent || navigator.vendor || '';
        return /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }

    function isMobileDevice() {
        var ua = navigator.userAgent || navigator.vendor || '';
        if (/Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua)) {
            return true;
        }
        return isIosDevice();
    }

    if (!isMobileDevice()) {
        return;
    }

    function isCameraFileInput(el) {
        return !!(el && el.tagName === 'INPUT' && el.type === 'file' && el.hasAttribute('capture')
            && !(el.closest && el.closest('#ScanQRCodeByCameraControlModal')));
    }

    function ensurePanel() {
        var panel = document.getElementById('bizsolMobileCameraPanel');
        if (panel) {
            return panel;
        }
        var style = document.createElement('style');
        style.textContent = ''
            + '#bizsolMobileCameraPanel{display:none;position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483000;background:#000;flex-direction:column;}'
            + '#bizsolMobileCameraPanel.is-open{display:flex;}'
            + '#bizsolMobileCameraPanel video{width:100%;flex:1 1 auto;min-height:0;object-fit:cover;background:#000;}'
            + '#bizsolMobileCameraPanel .bizsol-camera-actions{display:flex;gap:8px;padding:12px;padding-bottom:calc(12px + env(safe-area-inset-bottom));background:#fff;}'
            + '#bizsolMobileCameraPanel .bizsol-camera-actions .btn{flex:1;min-height:48px;font-size:16px;}';
        document.head.appendChild(style);

        panel = document.createElement('div');
        panel.id = 'bizsolMobileCameraPanel';
        panel.innerHTML = ''
            + '<video id="bizsolMobileCameraVideo" playsinline webkit-playsinline muted autoplay></video>'
            + '<div class="bizsol-camera-actions">'
            + '<button type="button" class="btn btn-success" id="bizsolMobileCameraCapture">Capture</button>'
            + '<button type="button" class="btn btn-danger" id="bizsolMobileCameraClose">Close Camera</button>'
            + '</div>';
        document.body.appendChild(panel);

        var video = panel.querySelector('video');
        video.playsInline = true;
        video.muted = true;
        panel.querySelector('#bizsolMobileCameraClose').addEventListener('click', closeCamera);
        panel.querySelector('#bizsolMobileCameraCapture').addEventListener('click', capturePhoto);
        return panel;
    }

    function closeCamera() {
        openToken++;
        if (cameraStream) {
            cameraStream.getTracks().forEach(function (track) { track.stop(); });
            cameraStream = null;
        }
        var video = document.getElementById('bizsolMobileCameraVideo');
        if (video) {
            video.pause();
            video.srcObject = null;
        }
        var panel = document.getElementById('bizsolMobileCameraPanel');
        if (panel) {
            panel.classList.remove('is-open');
        }
        activeInput = null;
    }

    function attachStream(token, stream) {
        if (token !== openToken) {
            stream.getTracks().forEach(function (track) { track.stop(); });
            return;
        }
        cameraStream = stream;
        var video = document.getElementById('bizsolMobileCameraVideo');
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.playsInline = true;
        video.muted = true;
        video.autoplay = true;
        video.srcObject = stream;
        var playPromise = video.play();
        if (playPromise && playPromise.catch) {
            playPromise.catch(function (err) { console.log(err); });
        }
    }

    function openNativePicker(input) {
        if (!input) {
            return;
        }
        input.setAttribute('data-bizsol-native-camera', '1');
        input.click();
        setTimeout(function () {
            input.removeAttribute('data-bizsol-native-camera');
        }, 1500);
    }

    function cameraConstraints() {
        return [
            { audio: false, video: { facingMode: { ideal: 'environment' } } },
            { audio: false, video: true }
        ];
    }

    function openCamera(input) {
        var token = ++openToken;
        activeInput = input;
        ensurePanel().classList.add('is-open');
        var attempts = cameraConstraints();
        var index = 0;
        function tryNext() {
            if (token !== openToken) {
                return;
            }
            if (index >= attempts.length) {
                closeCamera();
                if (isIosDevice()) {
                    openNativePicker(input);
                    return;
                }
                if (window.toastr) {
                    toastr.error('Unable to open the camera. Please allow camera access.');
                }
                return;
            }
            navigator.mediaDevices.getUserMedia(attempts[index++]).then(function (stream) {
                attachStream(token, stream);
            }).catch(function (err) {
                console.log(err);
                if (token !== openToken) {
                    return;
                }
                tryNext();
            });
        }
        tryNext();
    }

    function capturePhoto() {
        var video = document.getElementById('bizsolMobileCameraVideo');
        var input = activeInput;
        if (!input || !video || !video.videoWidth) {
            return;
        }
        var canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.toBlob(function (blob) {
            if (!blob) {
                return;
            }
            try {
                var dataTransfer = new DataTransfer();
                dataTransfer.items.add(new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' }));
                input.files = dataTransfer.files;
            } catch (err) {
                console.log(err);
                return;
            }
            closeCamera();
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }, 'image/jpeg', 0.9);
    }

    document.addEventListener('click', function (event) {
        var input = event.target;
        if (!input || input.getAttribute && input.getAttribute('data-bizsol-native-camera') === '1') {
            return;
        }
        if (!isCameraFileInput(input)) {
            return;
        }
        // iPhone Safari can open the system camera without getUserMedia.
        // Use that when the page is not a secure https address, because getUserMedia is blocked there.
        if (isIosDevice() && (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)) {
            return;
        }
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            return;
        }
        event.preventDefault();
        openCamera(input);
    }, true);

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            closeCamera();
        }
    });

    installIosQrScanner();

    function installIosQrScanner() {
        if (!isIosDevice() || window.__bizsolIosQrInstalled) {
            return;
        }
        window.__bizsolIosQrInstalled = true;
        softenIosGetUserMedia();
        hideLegacyCameraToasts();
        var observer = new MutationObserver(function () {
            upgradeLegacyQrModal();
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
        upgradeLegacyQrModal();
    }

    function hideLegacyCameraToasts() {
        if (!window.toastr || toastr.__bizsolIosFilter) {
            return;
        }
        var originalError = toastr.error;
        toastr.error = function (msg) {
            var text = typeof msg === 'string' ? msg : ((msg && ((msg.name ? msg.name + ' ' : '') + (msg.message || ''))) || '');
            if (/Video source is required|Allow camera permission to load the video source list|NotAllowedError|not allowed by the user agent or the platform/i.test(text)) {
                return;
            }
            return originalError.apply(this, arguments);
        };
        toastr.__bizsolIosFilter = true;
    }

    function isLegacyCameraPreflight(constraints) {
        if (!constraints) {
            return false;
        }
        var keys = Object.keys(constraints);
        return keys.length === 1 && keys[0] === 'video' && constraints.video === true;
    }

    function softenCameraConstraints(constraints) {
        if (!constraints || constraints.video === true || !constraints.video) {
            return { audio: false, video: true };
        }
        var next = {};
        Object.keys(constraints.video).forEach(function (key) {
            next[key] = constraints.video[key];
        });
        if (next.deviceId && next.deviceId.exact) {
            next.deviceId = { ideal: next.deviceId.exact };
        }
        if (typeof next.facingMode === 'string') {
            next.facingMode = { ideal: next.facingMode };
        }
        return { audio: false, video: next };
    }

    function softenIosGetUserMedia() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || navigator.mediaDevices.__bizsolIosGetUserMedia) {
            return;
        }
        var nativeGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
        navigator.mediaDevices.getUserMedia = function (constraints) {
            var inactive = navigator.userActivation && navigator.userActivation.isActive === false;
            if (inactive && isLegacyCameraPreflight(constraints)) {
                return Promise.resolve(new MediaStream());
            }
            var safe = softenCameraConstraints(constraints);
            return nativeGetUserMedia(safe).catch(function (err) {
                if (safe.video && safe.video !== true) {
                    return nativeGetUserMedia({ audio: false, video: true });
                }
                return Promise.reject(err);
            });
        };
        navigator.mediaDevices.__bizsolIosGetUserMedia = true;
    }

    var iosScanMode = '';
    var iosReader = null;

    function upgradeLegacyQrModal() {
        var single = document.getElementById('ScanQRCodeByCameraControl_btnSingle');
        var video = document.getElementById('video');
        var builtInPhoto = document.getElementById('ScanQRCodeByCameraControl_Photo');
        if (!single || !video || (builtInPhoto && builtInPhoto.closest && builtInPhoto.closest('#ScanQRCodeByCameraControlModal'))) {
            return;
        }
        if (single.getAttribute('data-ios-camera') === '1') {
            return;
        }
        video.setAttribute('autoplay', 'true');
        video.setAttribute('muted', 'true');
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        if (!document.getElementById('ScanQRCodeByCameraControl_IosHint')) {
            var hint = document.createElement('div');
            hint.id = 'ScanQRCodeByCameraControl_IosHint';
            hint.style.cssText = 'font-size:13px;color:#275481;margin-top:6px;';
            hint.textContent = 'Tap Single Scan and allow camera access.';
            video.insertAdjacentElement('afterend', hint);
        }
        wireLegacyScanButton('ScanQRCodeByCameraControl_btnSingle', 'single');
        wireLegacyScanButton('ScanQRCodeByCameraControl_btnMultiple', 'multiple');
        var reset = document.getElementById('ScanQRCodeByCameraControl_btnReset');
        if (reset && reset.getAttribute('data-ios-camera') !== '1') {
            var freshReset = reset.cloneNode(true);
            freshReset.setAttribute('data-ios-camera', '1');
            reset.parentNode.replaceChild(freshReset, reset);
            freshReset.addEventListener('click', function (event) {
                event.preventDefault();
                if (iosReader) {
                    try { iosReader.reset(); } catch (err) { console.log(err); }
                }
            });
        }
    }

    function wireLegacyScanButton(id, mode) {
        var button = document.getElementById(id);
        if (!button) {
            return;
        }
        var fresh = button.cloneNode(true);
        fresh.setAttribute('data-ios-camera', '1');
        button.parentNode.replaceChild(fresh, button);
        fresh.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopImmediatePropagation();
            startIosQrScan(mode);
        });
    }

    function deliverIosQr(result) {
        var outputTextID = document.getElementById('hfOutputQRTextElementID');
        var callbackName = document.getElementById('hfCallBackFunctionName');
        if (outputTextID && outputTextID.value && window.jQuery) {
            window.jQuery('#' + outputTextID.value).val(result.text);
        }
        if (window.toastr) {
            toastr.success('Read text Is: ' + result.text);
        }
        if (iosScanMode === 'single') {
            if (iosReader) {
                try { iosReader.reset(); } catch (err) { console.log(err); }
            }
            if (window.jQuery) {
                window.jQuery('#ScanQRCodeByCameraControlModal').modal('hide');
            }
        }
        if (callbackName && callbackName.value && typeof window[callbackName.value] === 'function') {
            window[callbackName.value]();
        }
    }

    function openIosQrPhoto() {
        var photo = document.getElementById('ScanQRCodeByCameraControl_Photo');
        if (!photo) {
            photo = document.createElement('input');
            photo.type = 'file';
            photo.id = 'ScanQRCodeByCameraControl_Photo';
            photo.accept = 'image/*';
            photo.setAttribute('capture', 'environment');
            photo.style.display = 'none';
            photo.addEventListener('change', function () {
                if (photo.files && photo.files[0]) {
                    decodeIosQrPhoto(photo.files[0]);
                }
            });
            document.body.appendChild(photo);
        }
        photo.value = '';
        photo.click();
    }

    function decodeIosQrPhoto(file) {
        if (!file || !window.ZXing) {
            return;
        }
        if (!iosReader) {
            iosReader = new ZXing.BrowserMultiFormatReader();
        }
        var reader = new FileReader();
        reader.onload = function () {
            var img = new Image();
            img.onload = function () {
                Promise.resolve(iosReader.decodeFromImageElement(img)).then(function (result) {
                    if (result) {
                        deliverIosQr(result);
                    }
                }).catch(function () {
                    if (window.toastr) {
                        toastr.error('No QR code found in the photo. Take the photo again.');
                    }
                });
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    }

    function startIosQrScan(mode) {
        iosScanMode = mode;
        if (!window.ZXing || !ZXing.BrowserMultiFormatReader) {
            if (window.toastr) {
                toastr.error('QR scanner failed to start.');
            }
            return;
        }
        if (!iosReader) {
            iosReader = new ZXing.BrowserMultiFormatReader();
        }
        if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            openIosQrPhoto();
            return;
        }
        var attempts = [
            { audio: false, video: { facingMode: { ideal: 'environment' } } },
            { audio: false, video: true }
        ];
        var index = 0;
        function tryNext() {
            if (index >= attempts.length) {
                openIosQrPhoto();
                return;
            }
            var promise = iosReader.decodeFromConstraints(attempts[index++], 'video', function (result) {
                if (result) {
                    deliverIosQr(result);
                }
            });
            if (!promise || !promise.then) {
                return;
            }
            promise.then(function () {
                var hint = document.getElementById('ScanQRCodeByCameraControl_IosHint');
                if (hint) {
                    hint.remove();
                }
            }).catch(function (err) {
                console.log(err);
                try { iosReader.reset(); } catch (resetErr) { console.log(resetErr); }
                tryNext();
            });
        }
        tryNext();
    }
})();
