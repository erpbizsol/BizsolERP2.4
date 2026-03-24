import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';

// ── Numeric input helpers ────────────────────────────────────────────────────
// Block e, E, +, - keys that browsers allow in type="number"
function blockNonNumeric(e) {
    if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
}
// Strip any remaining non-numeric characters (paste, autofill, etc.)
function stripNonNumeric(el) {
    const val = el.value;
    const cleaned = val.replace(/[^0-9.]/g, '')   // keep digits and one dot
                       .replace(/(\..*)\./g, '$1');  // allow only one decimal point
    if (val !== cleaned) el.value = cleaned;
}
const USE_DUMMY = false;

// ── App-level state ─────────────────────────────────────────────────────────
const DEFAULT_BILL_ROW_COUNT = 1;
/** Edit: master PK from server (hdnGRNPaymentMasterCode mirrors this). */
let editMode = false;


}

}

}

}

}
        })
        .catch(function () {
            if (typeof toastr !== 'undefined') toastr.error('Failed to load payment list.');
            $('#gpaListTable').hide();
        });
}

}

}

}
        showToast('Loading...', 'info');
        try {
            await loadGRNPaymentApprovalByCode(codeNum);
            showFormView();
        } catch (e) {
            showToast('Failed to open record.', 'error');
        }
    });
}

}
    const modalEl = document.getElementById('gpaDeleteConfirmModal');
    if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
}

            try {
            }
                showToast(result.Msg ?? result.msg ?? 'Deleted successfully.', 'success');
                editMode = false;
                await loadGRNPaymentApprovalList();
                showListView();
            } else {
                showToast(result?.Msg ?? result?.msg ?? 'Delete failed.', 'error');
        }
        }
        }
    });

// ── DOM ready ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([loadVendorList(), loadBankPaymentList()]);
    setTodayDates();
    await loadGRNPaymentApprovalList();
    showListView();

    initBillGrid();

    // Allow only positive numbers with decimals in amount fields (same pattern as GRN txtTotalBillAmountManual)
    const headerAmt = document.getElementById('txtHeaderAmount');
    if (headerAmt) {
        headerAmt.addEventListener('keypress', e => {
            const char = String.fromCharCode(e.which);
            if (!/[\d.]/.test(char)) { e.preventDefault(); return; }
            if (char === '.' && headerAmt.value.includes('.')) e.preventDefault();
        });
        headerAmt.addEventListener('input', () => {
            headerAmt.value = headerAmt.value.replace(/[^\d.]/g, '').replace(/(\..*?)\..*/g, '$1');
            recalcFooter();
        });
}
});



    }
}

        });
    } catch (e) {
        console.error('Failed to load vendors:', e);
}
}

}
    rows.forEach(r => {
        tbody.insertAdjacentHTML('beforeend', billRowTemplate());
        const tr = tbody.querySelector('tr.bill-row:last-child');
        if (tr) applyBillDetailRow(tr, r);
    });
}

        return;
    }
}






// ══════════════════════════════════════════════════════════════════════════════
// BILL GRID
// ══════════════════════════════════════════════════════════════════════════════
function billRowTemplate() {
    return `
}


        }
}

function FilterCards(query) {
    const cards = document.querySelectorAll('.gpa-pay-card');
    let visible = 0;
    cards.forEach(function (card) {
        const match = !query || (card.dataset.search || '').includes(query);
        card.style.display = match ? '' : 'none';
        if (match) visible++;
    });
    ShowEmpty(visible === 0 && G_PaymentList.length > 0);
}




    }

        });
    const headerAmt = parseNum(document.getElementById('txtHeaderAmount'));
    const elTotal = document.getElementById('txtFooterTotal');
    const elAdv = document.getElementById('txtFooterAdvance');
    if (elTotal) elTotal.value = formatMoney(sum);
    if (elAdv) elAdv.value = formatMoney(headerAmt - sum);
}

}







        }

/**
 * Load existing voucher for edit (call when opening by Code / from list).
 * Expects API shape: master fields + detail array (names flexible).
 */
function firstMasterFromApi(root) {
    const vw = root?.VW_GRNPaymentMaster ?? root;
    const list = vw?.GRNPaymentMaster ?? root?.GRNPaymentMaster;
    if (Array.isArray(list) && list.length) return list[0];
    if (list && typeof list === 'object' && !Array.isArray(list)) return list;
    if (root && typeof root === 'object' && (root.Code !== undefined || root.EntryNo !== undefined || root.AccountMaster_Code !== undefined)
        && !root.GRNPaymentDetails && !root.GRNPaymentMaster) {
        return root;
    }
}

        );

        if (!master && details.length === 0) {
            showToast('Record not found.', 'warning');
        return;
    }
    let html = '';
    rows.forEach(function (item, idx) {
        const billNo = EscHtml(item.BillNo || item['BillNo'] || '—');
        const billDate = (item['Bill Date'] != null || item.BillDate != null)
            ? FmtDateDisplay(item['Bill Date'] != null ? item['Bill Date'] : item.BillDate)
            : '—';
        const totalManual = parseFloat(item.TotalBillAmountManual != null ? item.TotalBillAmountManual : item.totalBillAmountManual || 0);
        const netPay = parseFloat(item.NetPayable != null ? item.NetPayable : item.netPayable || 0);
        const payAmt = parseFloat(item['Payment Amount'] != null ? item['Payment Amount'] : item.PaymentAmount || 0);

}


    }



}


    }



            } else {
            }
        })
        .catch(function () {
            HideLoader();
            toastr.error('Error while ' + (action === 'Approve' ? 'approving' : 'rejecting') + ' GRN payment.');
        });
}

}
    const ref = document.getElementById('txtRefNo');
    if (ref) ref.value = '';
    const ha = document.getElementById('txtHeaderAmount');
    if (ha) ha.value = '';
    const nar = document.getElementById('txtNarration');
    if (nar) nar.value = '';
    const d1 = document.getElementById('dtPaymentDate');
    if (d1) d1.value = '';
    setTodayDates();
    clearBillRows();
    addBillRows(DEFAULT_BILL_ROW_COUNT);
    recalcFooter();

function CloseConfirmModal() {
    $('#modalGpaConfirm').modal('hide');
}

}


}

