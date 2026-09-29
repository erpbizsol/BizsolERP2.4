function _excelIsIOSClient() {
    var ua = String(navigator.userAgent || navigator.vendor || '');
    if (/iPhone|iPad|iPod/i.test(ua)) return true;
    if (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1) return true;
    return /Macintosh/i.test(ua) && 'ontouchend' in document;
}

function _excelNotify(type, message) {
    if (typeof window.toastr !== 'undefined' && window.toastr[type]) {
        window.toastr[type](message);
        return;
    }
    if (type === 'error') {
        alert(message);
    }
}

function _excelToUint8(out) {
    if (out instanceof Uint8Array) {
        return out;
    }
    if (out instanceof ArrayBuffer) {
        return new Uint8Array(out);
    }
    return new Uint8Array(out);
}

function _excelWorkbookToBlob(wb, forceOctetStream) {
    var mime = forceOctetStream
        ? 'application/octet-stream'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (typeof XLSX.write !== 'function') {
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

    return new Blob([_excelToUint8(out)], { type: mime });
}

function _excelOpenIosSave(blob, fullName) {
    if (typeof window.openInAppViewer === 'function') {
        var url = URL.createObjectURL(blob);
        window.openInAppViewer(url, fullName, { ownUrl: true, blob: blob });
        return true;
    }
    return false;
}

function _excelTryShareNow(blob, fullName) {
    if (typeof navigator.share !== 'function' || typeof File !== 'function') {
        return Promise.reject(new Error('Share not supported'));
    }
    var file = null;
    try {
        file = new File([blob], fullName, { type: 'application/octet-stream', lastModified: Date.now() });
    } catch (e1) {
        try {
            file = new File([blob], fullName, {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                lastModified: Date.now()
            });
        } catch (e2) {
            return Promise.reject(e2);
        }
    }
    try {
        return navigator.share({ files: [file], title: fullName, text: fullName });
    } catch (e3) {
        return Promise.reject(e3);
    }
}

const ExportToExcelControl = {
    ExportToExcel: function ExportToExcel(ExcelExportDataArray, hiddenFields = [], fileName = "ExportData") {
        if (!Array.isArray(ExcelExportDataArray) || ExcelExportDataArray.length === 0) {
            _excelNotify('error', 'No data to export.');
            return false;
        }

        if (typeof XLSX === 'undefined' || !XLSX.utils) {
            _excelNotify('error', 'Excel library failed to load. Please refresh and try again.');
            return false;
        }

        const exportData = ExcelExportDataArray.map(row => {
            const newRow = {};
            Object.keys(row).forEach(key => {
                if (!hiddenFields.includes(key)) {
                    newRow[key] = row[key];
                }
            });
            return newRow;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

        const fullName = String(fileName || 'ExportData').replace(/\.xlsx$/i, '') + '.xlsx';

        try {
            // iOS Safari ignores <a download> used by XLSX.writeFile, and opening an
            // .xlsx blob URL in a new tab shows Safari's "cannot open file" error.
            // Use octet-stream + in-app Save / Share → Save to Files instead.
            if (_excelIsIOSClient()) {
                if (typeof window.bizsolSaveExcelWorkbook === 'function') {
                    window.bizsolSaveExcelWorkbook(wb, fullName);
                    return 'ios';
                }
                const blob = _excelWorkbookToBlob(wb, true);
                _excelTryShareNow(blob, fullName).catch(function (err) {
                    if (err && err.name === 'AbortError') {
                        return;
                    }
                    if (!_excelOpenIosSave(blob, fullName)) {
                        _excelNotify('info', 'Tap Save / Share, then choose Save to Files.');
                    }
                });
                return 'ios';
            }

            XLSX.writeFile(wb, fullName);
            return true;
        } catch (err) {
            if (_excelIsIOSClient()) {
                try {
                    const blob = _excelWorkbookToBlob(wb, true);
                    if (!_excelOpenIosSave(blob, fullName)) {
                        _excelNotify('error', (err && err.message) || 'Excel download failed.');
                    }
                    return 'ios';
                } catch (e2) { }
            }
            _excelNotify('error', (err && err.message) || 'Excel download failed.');
            return false;
        }
    },
    ExportWorkbook: function ExportWorkbook(wb, fileName) {
        const fullName = String(fileName || 'ExportData').replace(/\.xlsx$/i, '') + '.xlsx';
        if (!wb) {
            _excelNotify('error', 'No data to export.');
            return false;
        }
        try {
            if (_excelIsIOSClient()) {
                if (typeof window.bizsolSaveExcelWorkbook === 'function') {
                    window.bizsolSaveExcelWorkbook(wb, fullName);
                    return 'ios';
                }
                const blob = _excelWorkbookToBlob(wb, true);
                _excelTryShareNow(blob, fullName).catch(function (err) {
                    if (err && err.name === 'AbortError') {
                        return;
                    }
                    _excelOpenIosSave(blob, fullName);
                });
                return 'ios';
            }
            XLSX.writeFile(wb, fullName);
            return true;
        } catch (err) {
            _excelNotify('error', (err && err.message) || 'Excel download failed.');
            return false;
        }
    }
}

export { ExportToExcelControl }
