/* ============================================================================
   app-22-widget-previews.js
   DASHBOARD SETUP — previews in the widget library
   ----------------------------------------------------------------------------
   The library listed 24 widgets as a title and a drag handle, which asks the
   user to know from the words alone whether "Active tickets" is a table, a
   count, or a chart. Two of them ("Top drivers", "Bottom drivers") differ
   only in a word. So each item now shows the widget itself, rendered small.

   The preview is the real card, not a drawing of one: dbCardHtml(def, 'q')
   with the real body, the same substitution the onboarding wizard makes. A
   fixed 360px stage is CSS-scaled to the item width, which lands around 0.8
   and keeps the type legible while reading as a miniature rather than a live
   widget. The frame is pointer-events:none so the whole item stays one drag
   target.

   Two consequences that drove the layout:

     1. The grid is one column now. At two-up an item is 134px wide, the same
        card scales to 0.45, and 12px type becomes 5px. That is a silhouette,
        not a preview, and silhouettes are what the titles already were.
     2. Fleet map is not scaled. Leaflet measures itself with
        getBoundingClientRect, which a CSS scale corrupts, so that one item
        renders at 1:1 in a shorter frame and gets a real still map through
        app-13's own dbInitMaps. The alternative was a fake map panel, and a
        real one is available for the cost of a scale exception.

   The panel also grew its own header controls. It is a drawer now, overlaying
   the page rather than reserving a column, so the Save changes button in the
   page header is out of reach the moment you scroll: the head is sticky and
   carries Done, which is the same commit dbEditToggle() has always been.

   Last thing here, and it is layout rather than preview: the top shelf is
   capped at five. It was uncapped, so a sixth widget wrapped onto a second
   line of quarter cards, which is not what that shelf is. A saved layout with
   more than five gets its overflow moved down into the workspace rather than
   thrown away.

   A full shelf does not mean a closed shelf. Dropping a new widget ONTO a
   card in a full shelf swaps it: the card you aimed at is the one that
   leaves, which is what the blue drop outline has been promising all along.
   Only the trailing append is refused, because there is no card under the
   cursor to say which one you meant. Swapping is the reason the cap can be
   hard without being a dead end.

   Everything else in the library is unchanged: the placed check, the drag
   payload, Restore defaults, the categories and their order.

   Wraps dbRenderLibrary rather than editing app-13. The map lifecycle uses
   app-13's dbKillMaps/dbInitMaps scoped to #db-library, so re-rendering the
   library never leaves an orphaned Leaflet instance behind.

   Load order: after app-13.
   ========================================================================== */

/* The stage is a fixed-width board that gets scaled to whatever the item
   gives us, which is how the onboarding preview fits a 1360px dashboard into
   a third of a pane. */
var DBP_STAGE_W = 360;
var DBP_FRAME_H = 168;     /* scaled widgets */
var DBP_MAP_H = 150;       /* fleet map, unscaled */

function dbpItemHtml(w, isPlaced) {
  var isMap = (w.id === 'fleet-map');
  var body = '';
  try { body = dbCardHtml(w, 'q'); }
  catch (e) { body = '<div class="db-card db-size-q"></div>'; }

  return '<div class="db-lib-item' + (isPlaced ? ' placed' : '') + (isMap ? ' dbp-raw' : '') + '"'
    + ' draggable="true" ondragstart="dbDragStart(event,\'lib\',null,0,0,\'' + w.id + '\')">'
    + '<div class="db-lib-item-head">'
      + '<div class="db-lib-item-title">' + dbEsc(w.title) + '</div>'
      + (isPlaced
          ? '<div class="db-lib-check" title="Already on your dashboard">&#10003;</div>'
          : '<div class="db-lib-drag" title="Drag onto your dashboard">&#8942;&#8942;</div>')
    + '</div>'
    + '<div class="dbp-frame"><div class="dbp-stage">' + body + '</div></div>'
    + '</div>';
}

/* Wrapped, not replaced outright: if app-13 ever grows a step in here that
   this file does not know about, the original still runs first and only the
   markup is swapped. */
var dbpOrigRenderLibrary = (typeof dbRenderLibrary === 'function') ? dbRenderLibrary : null;

window.dbRenderLibrary = function () {
  var lib = document.getElementById('db-library');
  if (!lib) return;

  /* Any map from the previous render goes before the markup that holds it. */
  if (typeof dbKillMaps === 'function') dbKillMaps('db-library');

  var placed = (typeof dbPlacedIds === 'function') ? dbPlacedIds() : {};
  var html = '<div class="db-lib-head">'
    + '<div class="db-lib-title">Widgets</div>'
    + '<div class="db-lib-sub">Drag the widgets to your dashboard to customize your experience. '
    + 'Keep what\u2019s important to you close at hand.</div>'
    + '<div class="dbp-head-actions">'
      + '<button class="db-go-pill" onclick="dbRestoreDefaults()">Restore defaults</button>'
      + '<button class="dbp-done" onclick="dbEditToggle()">Done</button>'
    + '</div></div>';

  DB_CATS.forEach(function (cat) {
    var items = DB_WIDGETS.filter(function (w) { return w.cat === cat.id; });
    if (!items.length) return;
    html += '<div class="db-lib-cat">' + cat.label + '</div><div class="db-lib-grid">';
    items.forEach(function (w) { html += dbpItemHtml(w, !!placed[w.id]); });
    html += '</div>';
  });

  lib.innerHTML = html;
  dbpFit();
  /* still:true — the preview map pans and zooms for nobody. */
  if (typeof dbInitMaps === 'function') dbInitMaps(lib, true);
};

/* One scale for every stage in the panel, measured off a real frame rather
   than assumed from the panel width, since the panel has padding and the
   scrollbar comes and goes. */
function dbpFit() {
  var lib = document.getElementById('db-library');
  if (!lib) return;
  var frame = lib.querySelector('.dbp-frame');
  if (!frame) return;
  var s = frame.clientWidth / DBP_STAGE_W;
  if (!s || !isFinite(s)) return;
  lib.querySelectorAll('.db-lib-item:not(.dbp-raw) .dbp-stage').forEach(function (el) {
    el.style.transform = 'scale(' + s.toFixed(4) + ')';
  });
}

window.addEventListener('resize', dbpFit);


/* ── Top shelf: five, and no sixth ─────────────────────────────────────────
   The shelf is one line of quarter cards. Past five they wrapped onto a
   second line, which reads as a second shelf nobody asked for, so both ways
   into the shelf stop at five. Refusing loudly beats silently reflowing:
   the drop is dropped and the toast says why. */

var DBP_TOP_MAX = 5;

function dbpTopFull() {
  var ids = (dbLayout.top && dbLayout.top[0]) ? dbLayout.top[0] : [];
  return ids.length >= DBP_TOP_MAX;
}

function dbpRefuse() {
  if (typeof amToast === 'function') {
    amToast('The top shelf holds ' + DBP_TOP_MAX + '. Drop onto a card to swap it out.');
  }
  dbDragPayload = null;
  dbRenderDesktop();
}

/* Swap in place. The dragged widget takes the target's slot and the target
   leaves the shelf; a widget already on the shelf trades places with it
   instead, so a swap never costs you a card you did not choose to remove. */
function dbpSwapTop(cellIdx, id) {
  var shelf = dbLayout.top[0];
  if (!shelf || cellIdx == null || cellIdx < 0 || cellIdx >= shelf.length) return false;
  var p = dbDragPayload;
  if (p && p.kind === 'mv') {
    /* Reordering from elsewhere on the board: the displaced card goes where
       the dragged one came from rather than off the dashboard. */
    var from = dbLayout[p.zone][p.r];
    if (!from) return false;
    var displaced = shelf[cellIdx];
    shelf[cellIdx] = id;
    from[p.c] = displaced;
    return true;
  }
  shelf[cellIdx] = id;
  return true;
}

/* A layout saved before the cap existed, or built by the onboarding wizard,
   can arrive with six. Move the overflow into the workspace as its own row
   instead of deleting widgets the user chose. */
function dbpTrimTop() {
  if (!dbLayout || !dbLayout.top || !dbLayout.top.length) return;
  var ids = dbLayout.top[0];
  if (ids.length <= DBP_TOP_MAX) return;
  var over = ids.splice(DBP_TOP_MAX);
  dbLayout.work = dbLayout.work || [];
  dbLayout.work.unshift(over);
}

var dbpOrigRenderDesktop = (typeof dbRenderDesktop === 'function') ? dbRenderDesktop : null;
window.dbRenderDesktop = function () {
  dbpTrimTop();
  return dbpOrigRenderDesktop ? dbpOrigRenderDesktop.apply(this, arguments) : undefined;
};

var dbpOrigTopAppendDrop = (typeof dbTopAppendDrop === 'function') ? dbTopAppendDrop : null;
window.dbTopAppendDrop = function (e) {
  /* A card already on the shelf being reordered is not a sixth card. */
  var moving = dbDragPayload && dbDragPayload.kind === 'mv' && dbDragPayload.zone === 'top';
  if (dbpTopFull() && !moving) { if (e) { e.preventDefault(); e.stopPropagation(); } dbpRefuse(); return; }
  return dbpOrigTopAppendDrop ? dbpOrigTopAppendDrop.apply(this, arguments) : undefined;
};

var dbpOrigCellDrop = (typeof dbCellDrop === 'function') ? dbCellDrop : null;
window.dbCellDrop = function (e, zone, rowIdx, cellIdx) {
  var p = dbDragPayload;
  var movingWithinShelf = p && p.kind === 'mv' && p.zone === 'top';
  if (zone === 'top' && dbpTopFull() && !movingWithinShelf && p) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    var id = p.id;
    if (dbpSwapTop(cellIdx, id)) {
      var out = null;
      try { out = dbDef(id); } catch (err) {}
      dbDragPayload = null;
      dbRenderDesktop();
      if (typeof amToast === 'function' && out) amToast(out.title + ' replaced the widget in that slot');
      return;
    }
    dbpRefuse(); return;
  }
  return dbpOrigCellDrop ? dbpOrigCellDrop.apply(this, arguments) : undefined;
};
