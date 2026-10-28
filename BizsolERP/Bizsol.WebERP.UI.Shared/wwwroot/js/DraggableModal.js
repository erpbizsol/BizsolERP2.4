(function () {
    var OVERLAY_BACKDROP_SELECTOR = '.im-backdrop, .vm-backdrop, .bs-backdrop, .ee-backdrop';
    var HANDLE_SELECTOR = ''
        + '.modal-header, .ac-modal-header, [data-modal-drag-handle],'
        + '.im-modal-header, .im-view-header,'
        + '.vm-modal-header, .vm-view-header';
    var SHELL_SELECTOR = ''
        + '.modal-dialog,'
        + '.im-modal, .im-view-modal, .im-delete-modal, .im-success-modal,'
        + '.vm-modal, .vm-view-modal, .vm-delete-modal, .vm-verify-modal, .vm-success-modal';
    var IGNORE_SELECTOR = ''
        + 'button, a, input, select, textarea, label, [data-bs-dismiss],'
        + ' .btn-close, .select2-container, .im-modal-close, .im-view-close-btn, .vm-modal-close, .vm-view-close-btn';
    var MIN_VISIBLE = 80;

    var drag = null;

    function injectStyles() {
        if (document.getElementById('bizsolDraggableModalStyles')) {
            return;
        }
        var style = document.createElement('style');
        style.id = 'bizsolDraggableModalStyles';
        style.textContent = ''
            + '.modal:not([data-no-drag]) .modal-header,'
            + '.modal:not([data-no-drag]) .ac-modal-header,'
            + '.modal:not([data-no-drag]) [data-modal-drag-handle],'
            + '.im-backdrop:not([data-no-drag]) .im-modal-header,'
            + '.im-backdrop:not([data-no-drag]) .im-view-header,'
            + '.vm-backdrop:not([data-no-drag]) .vm-modal-header,'
            + '.vm-backdrop:not([data-no-drag]) .vm-view-header{'
            + 'cursor:move;touch-action:none;user-select:none;-webkit-user-select:none;}'
            + 'body.bizsol-modal-dragging, body.bizsol-modal-dragging *{'
            + 'user-select:none!important;-webkit-user-select:none!important;cursor:move!important;}'
            + 'body.bizsol-modal-dragging .im-backdrop.show,'
            + 'body.bizsol-modal-dragging .vm-backdrop.show,'
            + 'body.bizsol-modal-dragging .bs-backdrop.show,'
            + 'body.bizsol-modal-dragging .ee-backdrop.show,'
            + 'body.bizsol-modal-dragging .modal.show{z-index:100030!important;}';
        document.head.appendChild(style);
    }

    function readOffset(dialog) {
        return {
            x: parseFloat(dialog.getAttribute('data-drag-x')) || 0,
            y: parseFloat(dialog.getAttribute('data-drag-y')) || 0
        };
    }

    function applyOffset(dialog, x, y) {
        dialog.setAttribute('data-drag-x', x);
        dialog.setAttribute('data-drag-y', y);
        dialog.style.translate = x + 'px ' + y + 'px';
    }

    function resetDialogPosition(dialog) {
        if (!dialog) {
            return;
        }
        dialog.removeAttribute('data-drag-x');
        dialog.removeAttribute('data-drag-y');
        dialog.style.removeProperty('translate');
    }

    function resetDialog(root) {
        if (!root) {
            return;
        }
        if (root.classList.contains('modal')) {
            resetDialogPosition(root.querySelector('.modal-dialog'));
            return;
        }
        if (root.classList.contains('im-backdrop') || root.classList.contains('vm-backdrop')
            || root.classList.contains('bs-backdrop') || root.classList.contains('ee-backdrop')) {
            root.querySelectorAll(SHELL_SELECTOR).forEach(resetDialogPosition);
            return;
        }
        if (root.matches(SHELL_SELECTOR)) {
            resetDialogPosition(root);
        }
    }

    function resolveDragShell(handle) {
        var dialog = handle.closest('.modal-dialog');
        if (dialog) {
            var modal = dialog.closest('.modal');
            if (!modal || modal.hasAttribute('data-no-drag')) {
                return null;
            }
            return dialog;
        }

        dialog = handle.closest(
            '.im-modal, .im-view-modal, .im-delete-modal, .im-success-modal,'
            + '.vm-modal, .vm-view-modal, .vm-delete-modal, .vm-verify-modal, .vm-success-modal'
        );
        if (!dialog) {
            return null;
        }
        if (dialog.hasAttribute('data-no-drag')) {
            return null;
        }
        var backdrop = dialog.closest('.im-backdrop, .vm-backdrop, .bs-backdrop, .ee-backdrop');
        if (backdrop && backdrop.hasAttribute('data-no-drag')) {
            return null;
        }
        return dialog;
    }

    function portalOverlayToBody(el) {
        if (!el || el.parentElement === document.body) {
            return;
        }
        document.body.appendChild(el);
    }

    function portalAllOverlaysToBody() {
        document.querySelectorAll(OVERLAY_BACKDROP_SELECTOR).forEach(portalOverlayToBody);
    }

    function watchOverlayInsertion() {
        if (!window.MutationObserver) {
            return;
        }
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                mutation.addedNodes.forEach(function (node) {
                    if (!node || node.nodeType !== 1) {
                        return;
                    }
                    if (node.matches && node.matches(OVERLAY_BACKDROP_SELECTOR)) {
                        portalOverlayToBody(node);
                    }
                    if (node.querySelectorAll) {
                        node.querySelectorAll(OVERLAY_BACKDROP_SELECTOR).forEach(portalOverlayToBody);
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function isCustomBackdrop(el) {
        return el.classList && (
            el.classList.contains('im-backdrop')
            || el.classList.contains('vm-backdrop')
            || el.classList.contains('bs-backdrop')
            || el.classList.contains('ee-backdrop')
        );
    }

    function onPointerDown(event) {
        if (event.button !== undefined && event.button !== 0) {
            return;
        }
        var handle = event.target.closest && event.target.closest(HANDLE_SELECTOR);
        if (!handle || event.target.closest(IGNORE_SELECTOR)) {
            return;
        }
        var dialog = resolveDragShell(handle);
        if (!dialog) {
            return;
        }

        var offset = readOffset(dialog);
        var rect = dialog.getBoundingClientRect();
        drag = {
            dialog: dialog,
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            baseX: offset.x,
            baseY: offset.y,
            left: rect.left,
            top: rect.top,
            width: rect.width
        };
        try {
            handle.setPointerCapture(event.pointerId);
        } catch (err) {
        }
        document.body.classList.add('bizsol-modal-dragging');
        event.preventDefault();
    }

    function onPointerMove(event) {
        if (!drag || event.pointerId !== drag.pointerId) {
            return;
        }
        var dx = event.clientX - drag.startX;
        var dy = event.clientY - drag.startY;

        var minDx = -drag.left - drag.width + MIN_VISIBLE;
        var maxDx = window.innerWidth - drag.left - MIN_VISIBLE;
        var minDy = -drag.top;
        var maxDy = window.innerHeight - drag.top - 40;
        dx = Math.min(Math.max(dx, minDx), maxDx);
        dy = Math.min(Math.max(dy, minDy), maxDy);

        applyOffset(drag.dialog, drag.baseX + dx, drag.baseY + dy);
    }

    function onPointerUp(event) {
        if (!drag || event.pointerId !== drag.pointerId) {
            return;
        }
        drag = null;
        document.body.classList.remove('bizsol-modal-dragging');
    }

    function onModalHidden(event) {
        var modal = event.target;
        if (modal && modal.classList && modal.classList.contains('modal')) {
            resetDialog(modal);
        }
    }

    function watchCustomBackdropClose() {
        if (!window.MutationObserver) {
            return;
        }
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.type !== 'attributes' || mutation.attributeName !== 'class') {
                    return;
                }
                var target = mutation.target;
                if (!isCustomBackdrop(target)) {
                    return;
                }
                if (!target.classList.contains('show')) {
                    resetDialog(target);
                }
            });
        });
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class'],
            subtree: true
        });
    }

    function start() {
        injectStyles();
        portalAllOverlaysToBody();
        watchOverlayInsertion();
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
        document.addEventListener('pointercancel', onPointerUp);
        document.addEventListener('hidden.bs.modal', onModalHidden);
        watchCustomBackdropClose();
        if (window.jQuery) {
            jQuery(document).on('hidden.bs.modal', '.modal', function () {
                resetDialog(this);
            });
        }
    }

    window.BizsolDraggableModal = {
        reset: resetDialog
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
