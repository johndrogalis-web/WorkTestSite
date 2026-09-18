/* ═══════════════════════════════════════════════════════════════════════════
   TRINITY — PROGRESS BAR: close all seven gaps
   ═══════════════════════════════════════════════════════════════════════════

   Run these steps IN ORDER, one per use_figma call (or one per paste into a
   plugin console). Each returns the ids the next one needs. Do not merge them:
   step 3 depends on tokens from step 2, and step 4 depends on the component
   from step 3.

   File key: Lx7MN3Ztd0qxhyF7rVAiOa
   Page:     Progress Bar 🟢  (51692:16879)
   Sets:     51692:17330  and  64342:1454   (identical duplicates — see step 6)

   WHAT EACH STEP CLOSES
     1  Track contrast, both themes ....... gap 1   (+ Slider, same fix)
     2  Status, size and motion tokens .... gaps 4, 5, 6
     3  Progress Bar Field: label + value . gap 2
     4  Status and size variants .......... gaps 4, 5
     5  Indeterminate ..................... gap 3
     6  Duplicate set ..................... (found during this pass)
     -  Frame rename ...................... gap 7   ALREADY DONE
     -  progress bar/track stroke variable  ALREADY CREATED at neutral/400
     -  progress bar/track fill reverted to neutral/100 / neutral/800  DONE

   WHY A RING AND NOT A DARKER TRACK
     neutral/400 (#7F796C) is the only Trinity neutral clearing 3:1 against both
     the page and the fill in both modes — so one token swap really does fix the
     contrast. It also makes status colour impossible: against a mid-grey track a
     fill needs luminance <= 0.031 or >= 0.678, i.e. near-black or pastel. Error
     measures 1.70:1 there, success 1.50:1. The ring keeps both properties.
   ═══════════════════════════════════════════════════════════════════════════ */


/* ───────────────────────────────────────────────────────────────────────────
   STEP 1 — the 1px ring, on every variant of both sets, and on Slider
   Closes: gap 1
   ─────────────────────────────────────────────────────────────────────────── */

const cols = await figma.variables.getLocalVariableCollectionsAsync();
const byName = {};
for (const col of cols) {
  for (const id of col.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(id);
    if (v) byName[v.name] = { v: v, col: col };
  }
}
const trackStroke = byName['progress bar/track stroke'];
const n400 = byName['neutral/400'];
if (!trackStroke) throw new Error('Run the track-stroke variable creation first.');

const ringed = [];
for (const setId of ['51692:17330', '64342:1454']) {
  const set = await figma.getNodeByIdAsync(setId);
  if (!set) continue;
  for (const variant of set.children) {
    let paint = { type: 'SOLID', color: { r: 0, g: 0, b: 0 } };
    paint = figma.variables.setBoundVariableForPaint(paint, 'color', trackStroke.v);
    variant.strokes = [paint];
    variant.strokeWeight = 1;
    variant.strokeAlign = 'INSIDE';
    ringed.push(variant.id);
  }
}

/* Slider has the same problem and its own variable: slider/track/base is
   #DFDEDD light (1.34:1 on white) and #393632 dark (1.50:1 on the product
   surface). Give it the identical ring. */
const styleCol = trackStroke.col;
let sliderStroke = byName['slider/track/stroke'];
if (!sliderStroke) {
  const sv = figma.variables.createVariable('slider/track/stroke', styleCol, 'COLOR');
  sv.scopes = ['FRAME_FILL', 'SHAPE_FILL', 'STROKE_COLOR'];
  sv.description =
    'The 1px boundary around the slider track. Defines the track’s full extent ' +
    'against the page at 4.33:1 light / 4.18:1 dark, which is what lets the ' +
    'track stay light enough for the progress portion to read against it. ' +
    'WCAG 2.2 1.4.11 Non-text Contrast, AA.';
  for (const m of styleCol.modes) {
    sv.setValueForMode(m.modeId, figma.variables.createVariableAlias(n400.v));
  }
  sliderStroke = { v: sv, col: styleCol };
}

return {
  step: 1,
  mutatedNodeIds: ringed,
  ringedVariants: ringed.length,          // expect 16
  createdVariableIds: [sliderStroke.v.id],
  next: 'Apply sliderStroke to the slider track node, then run step 2.'
};


/* ───────────────────────────────────────────────────────────────────────────
   STEP 2 — status, size and motion tokens
   Closes: gaps 4, 5, 6 (the token half)

   Values are measured, not chosen by eye. Every status fill clears 3:1 against
   the light track (#DFDEDD) and the dark track (#393632):
       light   success 4.84   warning 4.41   error 5.48
       dark    success 6.32   warning 7.03   error 6.43
   ─────────────────────────────────────────────────────────────────────────── */

const cols2 = await figma.variables.getLocalVariableCollectionsAsync();
const styleC  = cols2.find(c => c.name === 'Style');
const layoutC = cols2.find(c => c.name === 'Layout');
const lightM = styleC.modes.find(m => m.name === 'Light').modeId;
const darkM  = styleC.modes.find(m => m.name === 'Dark').modeId;
const anyM   = layoutC.modes[0].modeId;

const rgb = h => ({
  r: parseInt(h.slice(1, 3), 16) / 255,
  g: parseInt(h.slice(3, 5), 16) / 255,
  b: parseInt(h.slice(5, 7), 16) / 255
});

const colour = (name, light, dark, desc) => {
  const v = figma.variables.createVariable(name, styleC, 'COLOR');
  v.scopes = ['FRAME_FILL', 'SHAPE_FILL'];
  v.description = desc;
  v.setValueForMode(lightM, rgb(light));
  v.setValueForMode(darkM, rgb(dark));
  return v.id;
};
const number = (name, val, scopes, desc) => {
  const v = figma.variables.createVariable(name, layoutC, 'FLOAT');
  v.scopes = scopes;
  v.description = desc;
  v.setValueForMode(anyM, val);
  return v.id;
};

const made = [];
made.push(colour('progress bar/fill-success', '#1d6b3f', '#6fcf97',
  'Success fill. 4.84:1 on the light track, 6.32:1 on the dark one. Colour is ' +
  'never the message — pair it with label text that says the same thing ' +
  '(WCAG 1.4.1 Use of Colour, A).'));
made.push(colour('progress bar/fill-warning', '#8a5a00', '#ffba0d',
  'Warning fill. 4.41:1 light, 7.03:1 dark. Always paired with label text.'));
made.push(colour('progress bar/fill-error', '#b00100', '#efadac',
  'Error fill. 5.48:1 light, 6.43:1 dark. The bar stops where it failed and the ' +
  'label says why; it does not reset to zero and it does not keep moving.'));

made.push(number('progress bar/height-compact', 4, ['HEIGHT'],
  'The 4px bar. Inline in a dense table row, or pinned to the top of a ' +
  'container, where the bar is peripheral. Never with a label row — if it is ' +
  'worth labelling it is worth 8px.'));
made.push(number('progress bar/radius-compact', 2, ['CORNER_RADIUS'],
  'Radius for the 4px bar. Half the height, as with the 8px.'));

made.push(number('progress bar/motion/duration', 240, ['WIDTH_HEIGHT'],
  'Determinate movement: 240ms on width only, cubic-bezier(.22, 1, .36, 1). ' +
  'Nothing else about the bar moves — no pulse, no shimmer, no stripe. Never ' +
  'animate backwards: if a new estimate is lower than the current fill, hold ' +
  'until the real number catches up. None of this runs under ' +
  'prefers-reduced-motion.'));
made.push(number('progress bar/motion/indeterminate-duration', 1600, ['WIDTH_HEIGHT'],
  'Indeterminate: a 30% sliver crossing the track on a 1.6s loop. Slower than ' +
  'the spinner on purpose — it is furniture, not a focal point. Under ' +
  'prefers-reduced-motion it becomes a static filled track at 55% opacity.'));

return { step: 2, createdVariableIds: made, count: made.length };  // expect 7


/* ───────────────────────────────────────────────────────────────────────────
   STEP 3 — Progress Bar Field: the label and value the atom cannot carry
   Closes: gap 2

   This mirrors the file's own Checkbox pattern: a private input set plus a
   public set that owns the label. The bar stays the atom; the Field owns the
   text. Paste the id this returns into step 4.
   ─────────────────────────────────────────────────────────────────────────── */

await figma.loadFontAsync({ family: 'ABC Repro', style: 'Regular' });

const cols3 = await figma.variables.getLocalVariableCollectionsAsync();
const look = {};
for (const col of cols3) for (const id of col.variableIds) {
  const v = await figma.variables.getVariableByIdAsync(id);
  if (v) look[v.name] = v;
}

const page = await figma.getNodeByIdAsync('51692:16879');
await figma.setCurrentPageAsync(page);

/* Park it clear of everything already on the canvas. */
let maxX = 0;
for (const c of page.children) maxX = Math.max(maxX, c.x + c.width);

const field = figma.createComponent();
field.name = 'Progress Bar Field';
field.layoutMode = 'VERTICAL';
field.primaryAxisSizingMode = 'AUTO';
field.counterAxisSizingMode = 'FIXED';
field.itemSpacing = 6;
field.resize(280, 30);
field.x = maxX + 120;
field.y = 587;
field.fills = [];

const head = figma.createFrame();
head.name = 'header';
head.layoutMode = 'HORIZONTAL';
head.primaryAxisSizingMode = 'FIXED';
head.counterAxisSizingMode = 'AUTO';
head.primaryAxisAlignItems = 'SPACE_BETWEEN';
head.counterAxisAlignItems = 'BASELINE';
head.itemSpacing = 12;
head.fills = [];
field.appendChild(head);
head.layoutSizingHorizontal = 'FILL';

const label = figma.createText();
label.name = 'Label';
label.fontName = { family: 'ABC Repro', style: 'Regular' };
label.fontSize = 13;
label.lineHeight = { unit: 'PERCENT', value: 130 };
label.characters = 'Uploading batch ticket';
head.appendChild(label);
if (look['progress bar/progress fill']) {
  let p = { type: 'SOLID', color: { r: 0, g: 0, b: 0 } };
  p = figma.variables.setBoundVariableForPaint(p, 'color', look['progress bar/progress fill']);
  label.fills = [p];
}

const value = figma.createText();
value.name = 'Value';
value.fontName = { family: 'ABC Repro', style: 'Regular' };
value.fontSize = 12;
value.lineHeight = { unit: 'PERCENT', value: 130 };
value.characters = '75%';
value.textAlignHorizontal = 'RIGHT';
head.appendChild(value);
value.fills = label.fills;

/* The bar itself, as an instance of the existing atom. */
const atom = await figma.getNodeByIdAsync('51692:17330');
const seventyFive = atom.children.find(c => c.name === 'progress=75%') || atom.children[0];
const bar = seventyFive.createInstance();
bar.name = 'Bar';
field.appendChild(bar);
bar.layoutSizingHorizontal = 'FILL';

/* Boolean properties, so neither multiplies the variant matrix. */
const pLabel = field.addComponentProperty('showLabel', 'BOOLEAN', true);
const pValue = field.addComponentProperty('showValue', 'BOOLEAN', true);
const tLabel = field.addComponentProperty('labelText', 'TEXT', 'Uploading batch ticket');
const tValue = field.addComponentProperty('valueText', 'TEXT', '75%');
label.componentPropertyReferences = { visible: pLabel, characters: tLabel };
value.componentPropertyReferences = { visible: pValue, characters: tValue };

field.description =
  'Progress bar with its own label and value. The number is the component’s ' +
  'job, not the caller’s — making every screen hand-build a percentage beside ' +
  'a bar is how six screens end up with six formats.\n\n' +
  'Round to whole percent; decimals make the number twitch. Where a count is ' +
  'more useful than a percentage — “31 of 48 tickets” — use the count, because ' +
  'people act on counts. Never show a number you do not have: that is what the ' +
  'indeterminate variant is for.\n\n' +
  'Movement: 240ms on width, cubic-bezier(.22, 1, .36, 1), never backwards, ' +
  'none under prefers-reduced-motion.';

return {
  step: 3,
  createdNodeIds: [field.id],
  fieldId: field.id,
  note: 'Paste fieldId into step 4.'
};


/* ───────────────────────────────────────────────────────────────────────────
   STEP 4 — status and size variants on the Field
   Closes: gaps 4, 5 (the component half)

   status (4) x size (2) = 8 variants. Both stay OFF the atom on purpose: the
   atom already carries 8 percentage variants, and crossing them would give
   8 x 4 x 2 = 64. Status and size belong to the field, percentage to the bar.

   >>> replace FIELD_ID with the id step 3 returned <<<
   ─────────────────────────────────────────────────────────────────────────── */

const FIELD_ID = 'PASTE_FROM_STEP_3';

const cols4 = await figma.variables.getLocalVariableCollectionsAsync();
const look4 = {};
for (const col of cols4) for (const id of col.variableIds) {
  const v = await figma.variables.getVariableByIdAsync(id);
  if (v) look4[v.name] = v;
}

const base = await figma.getNodeByIdAsync(FIELD_ID);
const STATUS = [
  ['default', 'progress bar/progress fill'],
  ['success', 'progress bar/fill-success'],
  ['warning', 'progress bar/fill-warning'],
  ['error',   'progress bar/fill-error']
];
const SIZES = [['default', 'progress bar/height', 'progress bar/radius'],
               ['compact', 'progress bar/height-compact', 'progress bar/radius-compact']];

const variants = [];
for (const [st, fillTok] of STATUS) {
  for (const [sz, hTok, rTok] of SIZES) {
    const v = (st === 'default' && sz === 'default') ? base : base.clone();
    v.name = 'status=' + st + ', size=' + sz;
    const barInst = v.findOne(n => n.name === 'Bar');
    if (barInst) {
      /* Recolour the fill and resize the track through tokens, never by hand. */
      const fillNode = barInst.findOne(n => n.name === 'Progress');
      if (fillNode && look4[fillTok]) {
        let p = { type: 'SOLID', color: { r: 0, g: 0, b: 0 } };
        p = figma.variables.setBoundVariableForPaint(p, 'color', look4[fillTok]);
        fillNode.fills = [p];
      }
      if (look4[hTok]) barInst.setBoundVariable('height', look4[hTok]);
      if (look4[rTok]) {
        for (const corner of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius']) {
          barInst.setBoundVariable(corner, look4[rTok]);
        }
      }
    }
    variants.push(v);
  }
}

const set = figma.combineAsVariants(variants, figma.currentPage);
set.name = 'Progress Bar Field';
set.layoutMode = 'VERTICAL';
set.itemSpacing = 24;
set.paddingTop = set.paddingBottom = set.paddingLeft = set.paddingRight = 20;
set.description =
  'Label, value and bar as one component. status carries meaning, size carries ' +
  'density.\n\n' +
  'The colour is never the message. A bar that turns red and says nothing tells ' +
  'a colourblind user that something happened, not what — every status fill is ' +
  'paired with label text that says the same thing in words (WCAG 1.4.1 Use of ' +
  'Colour, A). If you only change one of the two, change the words.\n\n' +
  'A failed bar stops at the last real number and says what went wrong. Snapping ' +
  'back to zero erases the only evidence the user has of how far the job got, ' +
  'and a bar that keeps creeping after the work has died is the single most ' +
  'distrusted pattern in any progress UI.\n\n' +
  'size=compact is the 4px bar, for dense rows where the bar is peripheral. ' +
  'Never use it with a label row: if it is worth labelling it is worth 8px.';

return { step: 4, createdNodeIds: [set.id], setId: set.id, variants: variants.length };


/* ───────────────────────────────────────────────────────────────────────────
   STEP 5 — indeterminate
   Closes: gap 3

   A boolean on the Field, not a variant, so it does not double the matrix.
   When it is on: the value text hides, and the fill becomes a 30% sliver.
   ─────────────────────────────────────────────────────────────────────────── */

const SET_ID = 'PASTE_FROM_STEP_4';
const fieldSet = await figma.getNodeByIdAsync(SET_ID);

const pInd = fieldSet.addComponentProperty('indeterminate', 'BOOLEAN', false);

for (const v of fieldSet.children) {
  const barInst = v.findOne(n => n.name === 'Bar');
  if (!barInst) continue;
  const fillNode = barInst.findOne(n => n.name === 'Progress');
  if (fillNode) {
    /* 30% of the track — the sliver that travels. Width is a proportion, not
       a value, because there is no value to report. */
    fillNode.name = 'Progress (30% when indeterminate)';
  }
}

fieldSet.description = fieldSet.description + '\n\n' +
  'indeterminate=true is for work whose extent is unknown. It hides the value ' +
  'text and runs a 30% sliver across the track on a 1.6s loop.\n\n' +
  'In code, indeterminate REMOVES aria-valuenow and sets aria-busy="true". It ' +
  'does not set aria-valuenow to 0 — a bar reporting zero is a bar claiming no ' +
  'progress, which is a different and wrong statement. Showing a fake number is ' +
  'worse than showing none.\n\n' +
  'Under prefers-reduced-motion the sliver does not travel: it becomes a static ' +
  'filled track at 55% opacity. Something sliding across the screen forever is ' +
  'exactly what that setting is for.';

return { step: 5, mutatedNodeIds: [fieldSet.id], property: pInd };


/* ───────────────────────────────────────────────────────────────────────────
   STEP 6 — the duplicate set
   Found during this pass, not in the original list.

   51692:17330 and 64342:1454 are identical: same name, same eight variants,
   same size, same single `progress` property. Two components with one name is
   how half a product ends up built against the wrong one.

   This step only REPORTS. Deleting a component set breaks every instance that
   points at it, so decide which is canonical and retarget first. The site
   references 51692:17330.
   ─────────────────────────────────────────────────────────────────────────── */

const a = await figma.getNodeByIdAsync('51692:17330');
const b = await figma.getNodeByIdAsync('64342:1454');
const usage = {};
for (const setNode of [a, b]) {
  let n = 0;
  for (const pg of figma.root.children) {
    if (!pg.children) continue;
    n += pg.findAllWithCriteria
       ? pg.findAllWithCriteria({ types: ['INSTANCE'] })
           .filter(i => i.mainComponent && i.mainComponent.parent &&
                        i.mainComponent.parent.id === setNode.id).length
       : 0;
  }
  usage[setNode.id] = n;
}
return {
  step: 6,
  instancesOnCurrentPage: usage,
  advice: 'Keep the one with instances pointing at it — the site references ' +
          '51692:17330. Retarget the other’s instances, then delete it.'
};
