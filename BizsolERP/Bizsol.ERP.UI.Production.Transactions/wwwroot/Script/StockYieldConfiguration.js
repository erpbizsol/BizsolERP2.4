import { StockAgeingReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_StockAgeingReportService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

const OPEN_TO_SENTINEL = -1;
const COLOUR_MAX_LEN = 200;

let YC_ROWS = [];
let YC_NEXT_CLIENT_KEY = 1;

const DEFAULT_HEX = '#5c95ce';
/** First band (lowest Range from %, typically 0) is always red and not editable. */
const YC_FIRST_ROW_COLOUR = '#FF0000';

/** Next "Range from" after a band ends at `prevTo` (e.g. 73 → 73.01). */
const YC_RANGE_NEXT_STEP = 0.01;

/** Max gap between previous "Range to" and next "Range from" (rejects big skips like 70 → 100). */
const YC_MAX_RANGE_GAP = 1;

function ycRoundToStep(n) {
    return Math.round(Number(n) * 100) / 100;
}

function ycNextFromAfterPrevTo(prevTo) {
    return ycRoundToStep(Number(prevTo) + YC_RANGE_NEXT_STEP);
}

function ycNormalizeHex(v) {
    if (v == null) return '';
    let s = String(v).trim().slice(0, COLOUR_MAX_LEN);
    if (!s.startsWith('#')) s = '#' + s;
    return /^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(s) ? s.toUpperCase() : '';
}

function ycNumberOrUndef(raw) {
    if (raw === '' || raw === undefined || raw === null) return undefined;
    const n = Number(raw);
    return Number.isNaN(n) ? undefined : n;
}

function ycNormalizedUpperBound(fromToRaw) {
    const n = ycNumberOrUndef(fromToRaw);
    if (n === undefined) return OPEN_TO_SENTINEL;
    if (n === OPEN_TO_SENTINEL) return OPEN_TO_SENTINEL;
    return n;
}

function ycUpperIsOpen(fromToStored) {
    return fromToStored === OPEN_TO_SENTINEL || fromToStored === null || fromToStored === undefined;
}

/** True when Range to input is empty (maps to -1 in DB only until validation blocks save). */
function ycIsOpenToInput(raw) {
    return String(raw ?? '').trim() === '';
}

function ycNormalizeApiRow(raw) {
    const codeVal =
        raw != null ? (raw.Code !== undefined ? raw.Code : raw.code !== undefined ? raw.code : raw.Id !== undefined ? raw.Id : raw.id) : null;

    let fromRange = ycNumberOrUndef(
        raw != null && raw.FromRange !== undefined ? raw.FromRange : raw != null ? raw.fromRange : undefined
    );
    if (fromRange === undefined) {
        fromRange = ycNumberOrUndef(
            raw != null && raw.RangeFrom !== undefined ? raw.RangeFrom : raw != null ? raw.rangeFrom : undefined
        );
    }

    const fromToRaw =
        raw != null && raw.FromTo !== undefined ? raw.FromTo : raw != null ? raw.fromTo : raw != null ? raw.RangeTo : raw != null ? raw.rangeTo : undefined;

    const upper = ycNormalizedUpperBound(fromToRaw);

    const colRaw =
        raw != null
            ? raw.Colour !== undefined
                ? raw.Colour
                : raw.colour !== undefined
                  ? raw.colour
                  : raw.ColourCode !== undefined
                    ? raw.ColourCode
                    : raw.colourCode
            : null;

    let colourStr = '';
    if (colRaw != null && String(colRaw).trim() !== '') {
        const looksHex = /^\s*#?[0-9a-f]{3,}/i.test(String(colRaw));
        colourStr = looksHex ? ycNormalizeHex(colRaw) || DEFAULT_HEX : String(colRaw).trim().slice(0, COLOUR_MAX_LEN);
    } else {
        colourStr = DEFAULT_HEX;
    }

    return {
        clientKey: 'k_' + String(YC_NEXT_CLIENT_KEY++),
        Code:
            codeVal !== null && codeVal !== '' && codeVal !== undefined && Number(codeVal) > 0
                ? Number(codeVal)
                : null,
        FromRange: fromRange !== undefined && Number.isFinite(fromRange) ? fromRange : null,
        FromTo: Number.isFinite(upper) ? upper : OPEN_TO_SENTINEL,
        Colour: colourStr,
        _mode: 'view',
    };
}

function ycSortRows() {
    YC_ROWS.sort(function (a, b) {
        const fa = Number.isFinite(a.FromRange) ? a.FromRange : 1e9;
        const fb = Number.isFinite(b.FromRange) ? b.FromRange : 1e9;
        return fa - fb;
    });
}

function ycGetFirstBandRow() {
    let first = null;
    for (let i = 0; i < YC_ROWS.length; i++) {
        const r = YC_ROWS[i];
        if (!Number.isFinite(r.FromRange)) continue;
        if (!first || r.FromRange < first.FromRange) first = r;
    }
    return first;
}

function ycIsFirstBandRow(row) {
    if (!row || !Number.isFinite(row.FromRange)) return false;
    const first = ycGetFirstBandRow();
    return first != null && first.clientKey === row.clientKey;
}

function ycApplyFirstRowFixedColour() {
    const first = ycGetFirstBandRow();
    if (first) first.Colour = YC_FIRST_ROW_COLOUR;
}

function ycNormalizeListResponse(raw) {
    let inner = raw;
    if (raw && typeof raw === 'object') {
        inner = raw.data !== undefined ? raw.data : raw.Data !== undefined ? raw.Data : raw;
    }
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
        if (inner.rows !== undefined && Array.isArray(inner.rows)) inner = inner.rows;
        else if (inner.Rows !== undefined && Array.isArray(inner.Rows)) inner = inner.Rows;
    }
    const list = Array.isArray(inner) ? inner : [];
    const out = [];
    for (let i = 0; i < list.length; i++) {
        const r = ycNormalizeApiRow(list[i]);
        if (Number.isFinite(r.FromRange)) out.push(r);
    }
    return out;
}

function ycEscapeAttr(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function ycFormatToDisplay(row) {
    if (ycUpperIsOpen(row.FromTo)) return '<span class="text-muted fst-italic">—</span>';
    return row.FromTo;
}

function ycPersistFromTo(uiUpper) {
    if (uiUpper === null || uiUpper === undefined) return OPEN_TO_SENTINEL;
    return uiUpper;
}

/** Allow only non-negative decimal characters (Range from %). */
function ycSanitizeRangeFromInput(raw) {
    let s = String(raw ?? '').replace(/[^0-9.]/g, '');
    const i = s.indexOf('.');
    if (i === -1) return s;
    return s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '');
}

/** Digits and one decimal point only. Leading minus is cleared (user must enter a positive upper bound). */
function ycSanitizeRangeToInput(raw) {
    const s = String(raw ?? '');
    if (/^\s*-/.test(s)) return '';
    return ycSanitizeRangeFromInput(s);
}

function ycRenderRowInner(row, edit) {
    const open = ycUpperIsOpen(row.FromTo);
    const isFirstBand = ycIsFirstBandRow(row);
    const fromVal =
        edit && Number.isFinite(row.FromRange)
            ? row.FromRange
            : edit
              ? ''
              : Number.isFinite(row.FromRange)
                ? row.FromRange
                : '';

    let toShow = '';
    if (edit) {
        toShow = !open && Number.isFinite(row.FromTo) ? row.FromTo : '';
    }

    const displayColour = isFirstBand
        ? YC_FIRST_ROW_COLOUR
        : /^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(row.Colour || '')
          ? row.Colour
          : row.Colour;
    const pickerHex = isFirstBand
        ? YC_FIRST_ROW_COLOUR
        : /^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(row.Colour || '')
          ? row.Colour.slice(0, 7)
          : DEFAULT_HEX;

    let cells = '';

    if (edit) {
        cells += `<td style="vertical-align:middle;text-align:center;">
            <input type="text" class="form-control form-control-sm text-center yc-in-from"
                   inputmode="decimal" autocomplete="off" placeholder="Required"
                   value="${ycEscapeAttr(fromVal)}" />
        </td>`;
        cells += `<td style="vertical-align:middle;text-align:center;">
            <input type="text" class="form-control form-control-sm text-center yc-in-to"
                   inputmode="decimal" autocomplete="off" placeholder="Required"
                   value="${toShow === '' ? '' : ycEscapeAttr(toShow)}" />
        </td>`;
        if (isFirstBand) {
            cells += `<td style="vertical-align:middle;" class="yc-colour-wrap">
                <span style="display:inline-block;width:22px;height:22px;border-radius:4px;border:1px solid #ccc;background:${YC_FIRST_ROW_COLOUR};vertical-align:middle;"></span>
                <input type="hidden" class="yc-hex-input" value="${YC_FIRST_ROW_COLOUR}" />
                <span class="small text-muted ms-1">Fixed red</span>
            </td>`;
        } else {
            cells += `<td style="vertical-align:middle;" class="yc-colour-wrap">
                <input type="color" class="yc-picker" value="${ycEscapeAttr(pickerHex)}" />
                <input type="hidden" class="yc-hex-input" value="${ycEscapeAttr(displayColour)}" />
            </td>`;
        }
        cells += `<td class="yc-actions text-center" style="vertical-align:middle;white-space:nowrap;">
            <button type="button" class="btn btn-primary yc-save" data-client="${ycEscapeAttr(row.clientKey)}">Save</button>
            <button type="button" class="btn btn-secondary ms-1 yc-cancel" data-client="${ycEscapeAttr(row.clientKey)}">Cancel</button>
        </td>`;
    } else {
        cells += `<td style="text-align:center;">${Number.isFinite(row.FromRange) ? row.FromRange : '—'}</td>`;
        cells += `<td style="text-align:center;">${ycFormatToDisplay(row)}</td>`;
        const bg = isFirstBand
            ? YC_FIRST_ROW_COLOUR
            : /^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(row.Colour || '')
              ? row.Colour
              : '#eeeeee';
        cells += `<td class="yc-colour-wrap">
            <span style="display:inline-block;width:22px;height:22px;border-radius:4px;border:1px solid #ccc;background:${ycEscapeAttr(
                bg
            )};vertical-align:middle;"></span>
        </td>`;
        cells += `<td class="yc-actions text-center">
            <button type="button" class="btn btn-warning yc-edit" data-client="${ycEscapeAttr(row.clientKey)}">Edit</button>
            <button type="button" class="btn btn-danger ms-1 yc-delete" data-client="${ycEscapeAttr(row.clientKey)}">Delete</button>
        </td>`;
    }
    return cells;
}

function ycCloneRowBasis(row) {
    return {
        clientKey: row.clientKey,
        Code: row.Code,
        FromRange: row.FromRange,
        FromTo: row.FromTo,
        Colour: row.Colour,
        _snapshot: row._snapshot,
    };
}

function ycFindDataTrForClient(clientKey) {
    return $('#tblYieldConfigurationBody tr.yc-data-row').filter(function () {
        return $(this).attr('data-client-key') === clientKey;
    });
}

function ycFindValTrForClient(clientKey) {
    return $('#tblYieldConfigurationBody tr.yc-val-row').filter(function () {
        return $(this).attr('data-client-key') === clientKey;
    });
}

function ycRender() {
    ycApplyFirstRowFixedColour();
    const tb = $('#tblYieldConfigurationBody');
    tb.empty();

    const rows = YC_ROWS.slice();

    rows.forEach(function (row) {
        const edit = row._mode === 'edit';
        const tr = $('<tr>').addClass('yc-data-row').attr('data-client-key', row.clientKey);
        tr.html(ycRenderRowInner(row, edit));
        tb.append(tr);
        if (edit) {
            const trV = $('<tr>').addClass('yc-val-row').attr('data-client-key', row.clientKey);
            trV.html(
                '<td colspan="4" class="py-1 border-top-0 bg-light"><div class="yc-inline-err small text-danger mb-0"></div></td>'
            );
            tb.append(trV);
            trV.hide();
        }
    });

    tb.find('.yc-picker').off('input.yield').on('input.yield', function () {
        $(this).siblings('.yc-hex-input').val($(this).val().toUpperCase());
        ycNotifyRowValidation(this);
    });
    tb.find('.yc-hex-input').off('blur.yield').on('blur.yield', function () {
        let v = $(this).val().trim().slice(0, COLOUR_MAX_LEN);
        const row = $(this).closest('tr.yc-data-row');
        const pick = row.find('.yc-picker');
        const normHex = ycNormalizeHex(v);
        if (/^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)) {
            $(this).val(normHex);
            pick.val(normHex.slice(0, 7));
        } else if (normHex) {
            $(this).val(normHex);
            pick.val(normHex.slice(0, 7));
        } else if (v !== '') {
            $(this).val(v);
        }
        ycNotifyRowValidation(this);
    });

    function ycNotifyRowValidation(el) {
        const tr = $(el).closest('tr.yc-data-row');
        const ck = tr.attr('data-client-key');
        if (ck) ycRefreshRowValidation(ck);
    }

    tb.find('.yc-in-from')
        .off('input.ycnum')
        .on('input.ycnum', function () {
            const v = ycSanitizeRangeFromInput(this.value);
            if (this.value !== v) this.value = v;
            ycNotifyRowValidation(this);
        });
    tb.find('.yc-in-to')
        .off('input.ycnum')
        .on('input.ycnum', function () {
            const v = ycSanitizeRangeToInput(this.value);
            if (this.value !== v) this.value = v;
            ycNotifyRowValidation(this);
        });

    tb.find('.yc-hex-input')
        .off('input.ycval')
        .on('input.ycval', function () {
            ycNotifyRowValidation(this);
        });

    tb.find('.yc-in-from, .yc-in-to, .yc-picker')
        .off('keydown.ycenter')
        .on('keydown.ycenter', function (e) {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            const tr = $(this).closest('tr.yc-data-row');
            const chain = tr.find('.yc-in-from, .yc-in-to, .yc-picker').get();
            const i = chain.indexOf(this);
            if (i >= 0 && i < chain.length - 1) {
                const next = chain[i + 1];
                next.focus();
                try {
                    if (typeof next.select === 'function') next.select();
                } catch (_) {}
            } else {
                const saveBtn = tr.find('.yc-save').get(0);
                if (saveBtn) saveBtn.focus();
            }
        });

    tb.find('tr.yc-data-row').each(function () {
        const ck = $(this).attr('data-client-key');
        const r = ycFindRow(ck);
        if (r && r._mode === 'edit') ycRefreshRowValidation(ck);
    });
}

function ycFindRow(clientKey) {
    for (let i = 0; i < YC_ROWS.length; i++) {
        if (YC_ROWS[i].clientKey === clientKey) return YC_ROWS[i];
    }
    return null;
}

function ycCountEditing() {
    let n = 0;
    YC_ROWS.forEach(function (r) {
        if (r._mode === 'edit') n++;
    });
    return n;
}

function ycReadEditorRow(clientKey) {
    const tr = ycFindDataTrForClient(clientKey);
    const rawFrom = tr.find('.yc-in-from').val();
    const rawTo = tr.find('.yc-in-to').val().trim();
    const colourTxt = tr.find('.yc-hex-input').val().trim().slice(0, COLOUR_MAX_LEN);
    const rawFromStr = String(rawFrom ?? '').trim();
    const rawToStr = rawTo;
    let fromRange = parseFloat(rawFrom);

    let rangeToUi = null;
    if (ycIsOpenToInput(rawTo)) {
        rangeToUi = null;
    } else {
        const t = parseFloat(rawTo);
        rangeToUi = !Number.isNaN(t) ? t : null;
    }

    let colour = '';
    const row = ycFindRow(clientKey);
    if (row && ycIsFirstBandRow(row)) {
        colour = YC_FIRST_ROW_COLOUR;
    } else {
        const normalizedHexAttempt = ycNormalizeHex(colourTxt);
        if (colourTxt === '') {
            colour = ycNormalizeHex(tr.find('.yc-picker').val()) || DEFAULT_HEX;
        } else if (normalizedHexAttempt) {
            colour = normalizedHexAttempt;
        } else {
            colour = colourTxt;
        }
    }

    return {
        fromRange: fromRange,
        rangeToUi: rangeToUi,
        colour: colour,
        rawFromStr: rawFromStr,
        rawToStr: rawToStr,
        colourTxt: colourTxt,
    };
}

function ycValidatePayloadMsgs(fromRange, fromToPersisted, colour, rawFromStr, rawToStr, colourTxt) {
    const m = [];
    if (rawFromStr === '') {
        m.push('Range from (%) is required.');
    } else if (!Number.isFinite(fromRange) || fromRange < 0) {
        m.push('Range from (%) must be a valid non-negative number.');
    }
    if (rawToStr === '') {
        m.push('Range to (%) is required.');
    } else if (fromToPersisted === OPEN_TO_SENTINEL || !Number.isFinite(fromToPersisted)) {
        m.push('Range to (%) must be a valid number.');
    } else if (Number.isFinite(fromRange) && fromToPersisted <= fromRange) {
        m.push('Range to (%) must be greater than range from (%).');
    }
    if (colourTxt === undefined || colourTxt === null || String(colourTxt).trim() === '') {
        m.push('Colour is required (choose a colour).');
    } else if (/^#/.test(colour)) {
        if (!/^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(colour)) {
            m.push('Hex colour must be #RRGGBB or #RRGGBBAA.');
        }
    }
    return m;
}

function ycValidateBandsChainMsgs(clientKeyBeingSaved, fromRange, fromToPersisted) {
    const m = [];
    const bands = [];
    for (let i = 0; i < YC_ROWS.length; i++) {
        const r = YC_ROWS[i];
        if (r.clientKey === clientKeyBeingSaved) continue;
        if (!Number.isFinite(r.FromRange)) continue;
        bands.push({ from: r.FromRange, to: r.FromTo });
    }
    bands.push({ from: fromRange, to: fromToPersisted });
    bands.sort(function (a, b) {
        return a.from - b.from;
    });

    if (bands.length === 0) return m;

    const firstFrom = bands[0].from;
    if (firstFrom !== 0 && firstFrom !== 1) {
        m.push('The first range (lowest "Range from %") must start at 0 or 1 only.');
    }

    for (let i = 1; i < bands.length; i++) {
        const prev = bands[i - 1];
        const curr = bands[i];
        if (ycUpperIsOpen(prev.to)) {
            m.push(
                'A range with no upper limit must be the last row. Adjust the open-ended band or remove extra rows below it.'
            );
            break;
        }
        if (curr.from <= prev.to) {
            m.push(
                'Ranges must not overlap. The next "Range from" must be greater than the previous "Range to".'
            );
            break;
        }
        let gap = curr.from - prev.to;
        if (gap > YC_MAX_RANGE_GAP + 1e-9) {
            m.push(
                'The next "Range from" must follow the previous "Range to" without a large gap (at most ' +
                    YC_MAX_RANGE_GAP +
                    ' between them, e.g. after 71 you may use 72; do not skip from 70 to 100).'
            );
            break;
        }
    }
    return m;
}

function ycGetAllEditMessages(clientKey) {
    const p = ycReadEditorRow(clientKey);
    const d = ycPersistFromTo(p.rangeToUi);
    const msgs = ycValidatePayloadMsgs(p.fromRange, d, p.colour, p.rawFromStr, p.rawToStr, p.colourTxt);
    if (Number.isFinite(p.fromRange) && p.fromRange >= 0) {
        msgs.push.apply(msgs, ycValidateBandsChainMsgs(clientKey, p.fromRange, d));
    }
    return msgs;
}

function ycRefreshRowValidation(clientKey) {
    const row = ycFindRow(clientKey);
    if (!row || row._mode !== 'edit') return;
    const trData = ycFindDataTrForClient(clientKey);
    const trVal = ycFindValTrForClient(clientKey);
    if (!trData.length || !trVal.length) return;
    const msgs = ycGetAllEditMessages(clientKey);
    const errEl = trVal.find('.yc-inline-err');
    trData.find('.yc-save').prop('disabled', msgs.length > 0);
    if (msgs.length === 0) {
        errEl.text('');
        trVal.hide();
    } else {
        errEl.text(msgs.join(' · '));
        trVal.show();
    }
}

function ycValidatePayload(fromRange, fromToPersisted, colour, rawFromStr, rawToStr, colourTxt) {
    const msgs = ycValidatePayloadMsgs(fromRange, fromToPersisted, colour, rawFromStr, rawToStr, colourTxt);
    if (msgs.length > 0) {
        toastr.error(msgs[0]);
        return false;
    }
    return true;
}

/**
 * Lowest "Range from" (after sorting all bands) must be 0 or 1 only.
 * Each "Range from" must be greater than the prior "Range to", with gap at most YC_MAX_RANGE_GAP.
 * An open-ended row must be last. (Add row still defaults to prior "Range to" + 0.01.)
 */
function ycValidateBandsChain(clientKeyBeingSaved, fromRange, fromToPersisted) {
    const msgs = ycValidateBandsChainMsgs(clientKeyBeingSaved, fromRange, fromToPersisted);
    if (msgs.length > 0) {
        toastr.error(msgs[0]);
        return false;
    }
    return true;
}

/**
 * Next row defaults to (last band's Range to) + 0.01 when sorted by Range from.
 * If the rightmost band is open-ended, adding another row is not allowed.
 */
function ycSuggestedFromForNewRow() {
    const rows = YC_ROWS.filter(function (r) {
        return Number.isFinite(r.FromRange);
    }).slice();
    rows.sort(function (a, b) {
        return a.FromRange - b.FromRange;
    });
    if (rows.length === 0) return { blocked: false, from: null };
    const last = rows[rows.length - 1];
    if (ycUpperIsOpen(last.FromTo)) return { blocked: true };
    if (!Number.isFinite(last.FromTo)) return { blocked: false, from: null };
    return { blocked: false, from: ycNextFromAfterPrevTo(last.FromTo) };
}

function ycLoadGrid() {
    StockAgeingReportService.GetYieldConfigurationList()
        .then(function (raw) {
            YC_ROWS = ycNormalizeListResponse(raw).map(function (r) {
                r._mode = 'view';
                return r;
            });
            ycSortRows();
            ycApplyFirstRowFixedColour();
            ycRender();
        })
        .catch(function () {
            YC_ROWS = [];
            ycRender();
        });
}

function ycAddRowLocal() {
    if (ycCountEditing() > 0) {
        toastr.warning('Finish editing the current row before adding another.');
        return;
    }
    const sug = ycSuggestedFromForNewRow();
    if (sug.blocked) {
        toastr.warning('The last range has no upper limit. Close that band with a "Range to" value, or delete it, before adding another row.');
        return;
    }
    const isFirstBand = YC_ROWS.filter(function (r) {
        return Number.isFinite(r.FromRange);
    }).length === 0;
    YC_ROWS.push({
        clientKey: 'new_' + String(YC_NEXT_CLIENT_KEY++),
        Code: null,
        FromRange: isFirstBand ? 0 : sug.from != null ? sug.from : null,
        FromTo: OPEN_TO_SENTINEL,
        Colour: isFirstBand ? YC_FIRST_ROW_COLOUR : DEFAULT_HEX,
        _mode: 'edit',
        _snapshot: null,
    });
    ycRender();
}

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    $('#btnAddYieldRow').click(ycAddRowLocal);
    ycLoadGrid();

    $('#tblYieldConfigurationBody').on('click', '.yc-edit', function () {
        if (ycCountEditing() > 0) {
            toastr.warning('Save or cancel the row you are editing first.');
            return;
        }
        const ck = $(this).attr('data-client');
        const row = ycFindRow(ck);
        if (!row) return;
        row._snapshot = ycCloneRowBasis(row);
        row._mode = 'edit';
        ycRender();
    });

    $('#tblYieldConfigurationBody').on('click', '.yc-cancel', function () {
        const ck = $(this).attr('data-client');
        const row = ycFindRow(ck);
        if (!row) return;
        if (row.Code == null && row._snapshot === null && row.clientKey.startsWith('new_')) {
            YC_ROWS = YC_ROWS.filter(function (r) {
                return r.clientKey !== ck;
            });
        } else if (row._snapshot) {
            row.FromRange = row._snapshot.FromRange;
            row.FromTo = row._snapshot.FromTo;
            row.Colour = row._snapshot.Colour;
            row.Code = row._snapshot.Code;
            delete row._snapshot;
            row._mode = 'view';
        } else {
            row._mode = 'view';
        }
        ycRender();
    });

    $('#tblYieldConfigurationBody').on('click', '.yc-save', function () {
        const ck = $(this).attr('data-client');
        const row = ycFindRow(ck);
        if (!row) return;
        const p = ycReadEditorRow(ck);
        const fromToDb = ycPersistFromTo(p.rangeToUi);
        if (!ycValidatePayload(p.fromRange, fromToDb, p.colour, p.rawFromStr, p.rawToStr, p.colourTxt)) return;
        if (!ycValidateBandsChain(ck, p.fromRange, fromToDb)) return;

        const payload = {
            code: row.Code != null ? row.Code : 0,
            fromRange: p.fromRange,
            fromTo: fromToDb,
            colour: p.colour,
        };
        StockAgeingReportService.SaveYieldConfigurationRow(payload)
            .then(function () {
                toastr.success('Saved.');
                ycLoadGrid();
            })
            .catch(function () {});
    });

    $('#tblYieldConfigurationBody').on('click', '.yc-delete', function () {
        const ck = $(this).attr('data-client');
        const row = ycFindRow(ck);
        if (!row) return;

        if (row.Code == null) {
            if (!confirm('Remove this unsaved row?')) return;
            YC_ROWS = YC_ROWS.filter(function (r) {
                return r.clientKey !== ck;
            });
            ycRender();
            return;
        }

        if (!confirm('Delete this yield band from dbo.YieldConfiguration (Code=' + row.Code + ')?')) return;
        StockAgeingReportService.DeleteYieldConfigurationRow(row.Code)
            .then(function () {
                toastr.success('Deleted.');
                ycLoadGrid();
            })
            .catch(function () {});
    });
});
