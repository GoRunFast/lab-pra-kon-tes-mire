/* global db, saveBook, listBooks, deleteBook, getBook, getBookFile, getProgress, saveProgress,
   addBookmark, getSetting, setSetting, enforcePersistentStorage, saveBookCover, setBookFavorite,
   Reader, Quiz, I18N, UI,
   addWord, listWords, listWordsForBook, deleteWord, updateWordFSRS, addLookup, listLookups,
   listLanguages, addLanguage, deleteLanguage, saveDictionary, lookupWord */

(function () {
  'use strict';

  // Flashcard fields: id, word property, CSS class, i18n label key
  var FIELDS = [
    { id: 'word',       key: 'foreign',             cls: 'fc-word',    label: 'fieldWord' },
    { id: 'wordTr',     key: 'translation',         cls: 'fc-tr',      label: 'fieldWordTr' },
    { id: 'sentence',   key: 'context',             cls: 'fc-sent',    label: 'fieldSentence' },
    { id: 'sentenceTr', key: 'sentenceTranslation', cls: 'fc-sent-tr', label: 'fieldSentenceTr' }
  ];
  var DEFAULT_FRONT = ['word'];
  var DEFAULT_BACK = ['wordTr', 'sentence', 'sentenceTr'];

  // Study languages offered in the "New language" dialog: [ISO 639-1 code, name]
  var LANGUAGES = [
    ['ar', 'Arabic'], ['bg', 'Bulgarian'], ['zh', 'Chinese'], ['hr', 'Croatian'], ['cs', 'Czech'],
    ['da', 'Danish'], ['nl', 'Dutch'], ['en', 'English'], ['et', 'Estonian'], ['fi', 'Finnish'],
    ['fr', 'French'], ['de', 'German'], ['el', 'Greek'], ['he', 'Hebrew'], ['hi', 'Hindi'],
    ['hu', 'Hungarian'], ['id', 'Indonesian'], ['it', 'Italian'], ['ja', 'Japanese'], ['ko', 'Korean'],
    ['lv', 'Latvian'], ['lt', 'Lithuanian'], ['no', 'Norwegian'], ['fa', 'Persian'], ['pl', 'Polish'],
    ['pt', 'Portuguese'], ['ro', 'Romanian'], ['ru', 'Russian'], ['sr', 'Serbian'], ['sk', 'Slovak'],
    ['sl', 'Slovenian'], ['es', 'Spanish'], ['sv', 'Swedish'], ['th', 'Thai'], ['tr', 'Turkish'],
    ['uk', 'Ukrainian'], ['vi', 'Vietnamese']
  ];

  var state = {
    tab: 'library',
    viewMode: 'large',
    filter: 'all',
    sortKey: 'addedAt',      // 'addedAt' | 'title'
    sortDir: -1,             // -1 = descending (↓), 1 = ascending (↑)
    settings: {
      theme: 'light', accent: '#1a73e8', fontSize: 18,
      align: 'left', lineHeight: 1.6, readingMode: 'scroll', lang: 'en',
      longPressMs: 500
    },
    openBookId: null,
    lastBookId: null,
    pendingProgress: null,
    saveTimer: null,
    wakeLock: null,
    currentLangCode: 'en',
    selection: null,
    marks: { vocab: new Map(), looked: new Set() },
    dictBookId: null,
    // quiz
    cardFront: DEFAULT_FRONT.slice(),
    cardBack: DEFAULT_BACK.slice(),
    wordSortKey: 'createdAt', // 'createdAt' | 'foreign'
    wordSortDir: -1,
    quiz: {
      words: [], booksList: [], counts: {},
      books: new Set(),        // selected book keys (0 = words without a book)
      knownBooks: new Set(),
      checked: new Set(),      // checked word ids
      knownWords: new Set()
    },
    session: [], sessionIdx: 0, sessionResults: []
  };

  window.__closeWordModal = function () { var m = document.getElementById('wordModal'); if (m) m.hidden = true; };
  window.__closeLangModal = function () { var m = document.getElementById('langModal'); if (m) m.hidden = true; };

  // ===================== BOOT =====================
  function boot() {
    if (typeof Dexie === 'undefined') {
      console.error('[boot] Dexie not loaded');
      var ab = document.getElementById('addBookBtn');
      if (ab) ab.disabled = true;
      return;
    }
    I18N.set('en'); // English by default; a language picked in Settings is restored below

    bindTabs();
    bindLibrary();
    bindReader();
    bindQuiz();
    bindSettings();
    bindWordModal();
    bindLangModal();
    bindDictionaryView();
    bindSettingsEvents();
    bindLifecycle();

    applyTheme(state.settings.theme);
    applyFontSettings();

    var KEYS = [
      ['theme', 'light'], ['accent', '#1a73e8'], ['fontSize', 18], ['align', 'left'], ['lineHeight', 1.6],
      ['readingMode', 'scroll'], ['lang', 'en'], ['viewMode', 'large'], ['sortKey', 'addedAt'], ['sortDir', -1],
      ['longPressMs', 500], ['cardFront', DEFAULT_FRONT], ['cardBack', DEFAULT_BACK],
      ['wordSortKey', 'createdAt'], ['wordSortDir', -1]
    ];

    Promise.all(KEYS.map(function (k) { return getSetting(k[0], k[1]); })).then(function (arr) {
      var s = {};
      KEYS.forEach(function (k, i) { s[k[0]] = arr[i]; });
      state.settings.theme = s.theme;
      state.settings.accent = s.accent;
      state.settings.fontSize = Number(s.fontSize) || 18;
      state.settings.align = s.align;
      state.settings.lineHeight = Number(s.lineHeight) || 1.6;
      state.settings.readingMode = s.readingMode;
      state.settings.lang = s.lang || 'en';
      state.settings.longPressMs = Number(s.longPressMs) || 500;
      state.viewMode = s.viewMode === 'list' ? 'list' : 'large'; // the old "small" grid no longer exists
      state.sortKey = s.sortKey === 'title' ? 'title' : 'addedAt';
      state.sortDir = Number(s.sortDir) === 1 ? 1 : -1;
      state.cardFront = cleanFields(s.cardFront, DEFAULT_FRONT);
      state.cardBack = cleanFields(s.cardBack, DEFAULT_BACK);
      state.wordSortKey = s.wordSortKey === 'foreign' ? 'foreign' : 'createdAt';
      state.wordSortDir = Number(s.wordSortDir) === 1 ? 1 : -1;

      Reader.setLongPressDuration(state.settings.longPressMs);
      I18N.set(state.settings.lang);
      applyTheme(state.settings.theme);
      applyFontSettings();
      applyViewMode(state.viewMode);
      renderLangSelect();
      applyReadingMode();
      updateSortUI();
      updateWordSortUI();
      renderSides();
    }).catch(function (e) { console.error('[settings]', e); }).then(function () {
      refreshLibrary();
      refreshWords();
      refreshLanguages();
    });

    enforcePersistentStorage().then(function (r) {
      var el = document.getElementById('persistStatus');
      if (el) el.textContent = r.supported ? (r.persisted ? 'persistent ✓' : 'not granted') : 'not supported';
    }).catch(function () {});

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(function () {});
    }

    var addBtn = document.getElementById('addBookBtn');
    if (addBtn) addBtn.disabled = false;

    showTab('library');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  function cleanFields(arr, def) {
    var ids = FIELDS.map(function (f) { return f.id; });
    var out = Array.isArray(arr) ? arr.filter(function (x) { return ids.indexOf(x) > -1; }) : [];
    return out.length ? out : def.slice();
  }

  // ===================== LIFECYCLE (reading position is never lost) =====================
  function bindLifecycle() {
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') flushProgress();
    });
    window.addEventListener('pagehide', flushProgress);
  }

  /** Writes the latest reading position to IndexedDB immediately (cancels the debounce timer). */
  function flushProgress() {
    if (state.saveTimer) { clearTimeout(state.saveTimer); state.saveTimer = null; }
    if (state.pendingProgress && state.openBookId) {
      saveProgress(state.openBookId, state.pendingProgress).catch(function () {});
    }
  }

  // ===================== THEME / FONT =====================
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    document.querySelectorAll('.chip[data-theme]').forEach(function (b) {
      b.classList.toggle('chip-active', b.getAttribute('data-theme') === t);
    });
  }
  function applyFontSettings() {
    document.documentElement.style.setProperty('--font-size', state.settings.fontSize + 'px');
    document.documentElement.style.setProperty('--line-height', state.settings.lineHeight);
    document.documentElement.style.setProperty('--text-align', state.settings.align);
    var fsVal = document.getElementById('fsVal');
    if (fsVal) fsVal.textContent = state.settings.fontSize;
    var al = document.getElementById('setAlign');
    if (al) al.value = state.settings.align;
    var lh = document.getElementById('setLineHeight');
    if (lh) lh.value = state.settings.lineHeight;
    var lhVal = document.getElementById('lhVal');
    if (lhVal) lhVal.textContent = Number(state.settings.lineHeight).toFixed(1);
    var lp = document.getElementById('setLongPress');
    if (lp) lp.value = state.settings.longPressMs;
    var lpVal = document.getElementById('lpVal');
    if (lpVal) lpVal.textContent = state.settings.longPressMs;
  }

  // ===================== TABS =====================
  function bindTabs() {
    document.querySelectorAll('.nb').forEach(function (btn) {
      btn.addEventListener('click', function () {
        showTab(this.getAttribute('data-tab'));
      });
    });
  }

  function showTab(name) {
    if (state.tab === 'read' && name !== 'read') flushProgress();
    state.tab = name;
    ['library', 'read', 'quiz', 'settings', 'dict'].forEach(function (t) {
      var el = document.getElementById('tab-' + t);
      if (el) el.hidden = t !== name;
    });
    document.querySelectorAll('.nb').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === name);
    });
    document.body.setAttribute('data-active-tab', name);
    if (name !== 'read') Reader.clearSelection();
    if (name !== 'quiz') { var bm = $('bookMenu'); if (bm) bm.hidden = true; }
    if (name === 'library') refreshLibrary();
    if (name === 'quiz') refreshWords();
    if (name === 'settings') refreshLanguages();
  }

  // ===================== LIBRARY =====================
  function bindLibrary() {
    var addBtn = document.getElementById('addBookBtn');
    var fileInput = document.getElementById('fileInput');
    if (addBtn) addBtn.addEventListener('click', function () { fileInput.click(); });

    /** Generates and stores a cover for one imported book (best effort, never throws). */
    function makeCover(id) {
      return Promise.all([getBook(id), getBookFile(id)]).then(function (r) {
        return r[0] && r[1] ? Reader.generateCoverForBook(id, r[0].format, r[1].data) : null;
      }).catch(function () {});
    }

    if (fileInput) fileInput.addEventListener('change', function (e) {
      var files = Array.prototype.slice.call(e.target.files || []);
      var ok = files.filter(function (f) { return ['pdf', 'epub', 'fb2', 'txt'].indexOf(f.name.split('.').pop().toLowerCase()) > -1; });
      e.target.value = '';
      if (!files.length) return;
      if (!ok.length) { UI.toast(I18N.t('unsupportedFile'), 'warn'); return; }
      Promise.all(ok.map(saveBook)).then(function (ids) {
        refreshLibrary();
        showTab('library');
        return ids.reduce(function (p, id) { return p.then(function () { return makeCover(id); }); }, Promise.resolve()).then(refreshLibrary);
      }).catch(function (err) { UI.toast(I18N.t('importError') + ': ' + err.message, 'error'); });
    });

    document.querySelectorAll('.vt-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var v = this.getAttribute('data-view');
        state.viewMode = v;
        applyViewMode(v);
        setSetting('viewMode', v);
      });
    });

    document.querySelectorAll('.ftab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.filter = this.getAttribute('data-filter');
        document.querySelectorAll('.ftab').forEach(function (b) {
          b.classList.toggle('ftab-active', b.getAttribute('data-filter') === state.filter);
        });
        refreshLibrary();
      });
    });

    // Two independent toggles inside one button: the arrow flips the order, the label flips the type
    var sortBtn = document.getElementById('sortBtn');
    if (sortBtn) sortBtn.addEventListener('click', function (e) {
      if (e.target.closest('#sortDir')) {
        state.sortDir = -state.sortDir;
        setSetting('sortDir', state.sortDir);
      } else {
        state.sortKey = state.sortKey === 'addedAt' ? 'title' : 'addedAt';
        setSetting('sortKey', state.sortKey);
      }
      updateSortUI();
      refreshLibrary();
    });
  }

  function updateSortUI() {
    var label = document.getElementById('sortLabel');
    var dir = document.getElementById('sortDir');
    if (!label || !dir) return;
    label.textContent = state.sortKey === 'title' ? 'Title' : 'Added';
    dir.textContent = state.sortDir === -1 ? '↓' : '↑';
  }

  function applyViewMode(mode) {
    var grid = document.getElementById('booksGrid');
    if (!grid) return;
    grid.classList.remove('grid-large', 'grid-list');
    grid.classList.add('grid-' + mode);
    document.querySelectorAll('.vt-btn').forEach(function (b) {
      b.classList.toggle('vt-active', b.getAttribute('data-view') === mode);
    });
  }

  function refreshLibrary() {
    return listBooks().then(function (books) {
      var filtered = books.filter(function (b) {
        return state.filter === 'fav' ? !!b.favorite : true;
      });
      filtered.sort(function (a, b) {
        var r;
        if (state.sortKey === 'title') {
          r = String(a.title || '').localeCompare(String(b.title || ''), undefined, { sensitivity: 'base', numeric: true });
        } else {
          r = (a.addedAt || 0) - (b.addedAt || 0);
        }
        return r * state.sortDir;
      });

      var grid = document.getElementById('booksGrid');
      var empty = document.getElementById('emptyLib');
      if (!grid) return;
      grid.innerHTML = '';
      if (empty) empty.hidden = filtered.length > 0;

      filtered.forEach(function (b) { grid.appendChild(buildBookTile(b)); });
    });
  }

  function buildBookTile(b) {
    var tile = document.createElement('div');
    tile.className = 'tile';

    var coverInner;
    if (b.cover) {
      coverInner = '<div class="cover"><img src="' + b.cover + '" alt=""></div>';
    } else {
      coverInner = '<div class="cover cover-gen" style="--gen:' + colorFromTitle(b.title) + ';background:' + colorFromTitle(b.title) + '">' +
        '<span class="cover-gen-initial">' + esc((b.title || '?').charAt(0).toUpperCase()) + '</span>' +
        '<span class="cover-gen-fmt">' + (b.format || '').toUpperCase() + '</span></div>';
    }

    var favIcon = b.favorite
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';

    tile.innerHTML =
      coverInner +
      '<span class="tname">' + esc(b.title) + '</span>' +
      '<span class="tmeta">' + (b.format || '').toUpperCase() + '</span>' +
      '<div class="tile-actions">' +
        '<button class="tact" data-act="words" title="Words">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>' +
        '</button>' +
        '<button class="tact' + (b.favorite ? ' tact-active' : '') + '" data-act="fav" title="Favorite">' + favIcon + '</button>' +
        '<button class="tact tact-danger" data-act="del" title="Delete">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>' +
        '</button>' +
      '</div>';

    tile.querySelector('.cover').addEventListener('click', function () { openReader(b.id); });
    tile.querySelector('.tname').addEventListener('click', function () { openReader(b.id); });

    tile.querySelector('[data-act="words"]').addEventListener('click', function (ev) {
      ev.stopPropagation();
      openDictionaryView(b.id);
    });
    tile.querySelector('[data-act="fav"]').addEventListener('click', function (ev) {
      ev.stopPropagation();
      setBookFavorite(b.id, !b.favorite).then(refreshLibrary);
    });
    tile.querySelector('[data-act="del"]').addEventListener('click', function (ev) {
      ev.stopPropagation();
      UI.confirm(tf('deleteBookQ', b.title), { danger: true, ok: I18N.t('delete') }).then(function (y) {
        if (y) deleteBook(b.id).then(refreshLibrary);
      });
    });

    return tile;
  }

  function colorFromTitle(str) {
    str = String(str || '');
    var hash = 0;
    for (var i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) | 0;
    var hue = Math.abs(hash) % 360;
    return 'hsl(' + hue + ',55%,60%)';
  }

  // ===================== READER =====================
  function bindReader() {
    var back = $('backBtn'), rot = $('rotBtn'), bm = $('bmBtn'), pop = $('selPopup');

    if (back) back.addEventListener('click', closeReader);
    if (rot) rot.addEventListener('click', function () { toggleOrientation(this); });
    if ($('errBackBtn')) $('errBackBtn').addEventListener('click', closeReader);
    if ($('retryBtn')) $('retryBtn').addEventListener('click', function () { if (state.openBookId) openReader(state.openBookId); });
    if (bm) bm.addEventListener('click', function () {
      if (!state.openBookId) return;
      var p = state.pendingProgress || { percentage: 0 };
      addBookmark(state.openBookId, 'Bookmark @ ' + Math.round((p.percentage || 0) * 100) + '%',
        p.percentage || 0, p.cfi || null)
        .then(function () { UI.toast(I18N.t('bookmarkAdded'), 'success'); })
        .catch(function (e) { UI.toast(e.message, 'error'); });
    });

    /** Places the popup above the selection (flips below when there is no room) and clamps it inside the viewport. */
    function place(r) {
      pop.style.visibility = 'hidden';
      pop.hidden = false;
      var w = pop.offsetWidth, h = pop.offsetHeight, m = 8;
      var top = r.top - h - 10;
      if (top < m + 48) top = r.bottom + 14;
      pop.style.left = Math.max(m, Math.min(window.innerWidth - w - m, r.x - w / 2)) + 'px';
      pop.style.top = Math.max(m, Math.min(window.innerHeight - h - m, top)) + 'px';
      pop.style.visibility = '';
    }

    // Reader -> UI: one popup, repositioned on every new selection, hidden on every clear
    Reader.onSelection(function (info) { state.selection = info; place(info.rect); });
    Reader.onClear(function () { pop.hidden = true; });
    Reader.onBlankTap(function () { $('rtb').classList.toggle('hidden'); });

    if (pop) {
      pop.addEventListener('pointerdown', function (e) { e.preventDefault(); }); // keep selection alive until the click
      pop.addEventListener('click', function (e) {
        var btn = e.target.closest('.sel-btn');
        if (!btn) return;
        var s = state.selection;
        Reader.clearSelection();
        handleSelectionAction(btn.getAttribute('data-action'), s);
      });
    }
    // Outside press (toolbar, nav, anywhere but the reader body / popup) and Esc / resize dismiss the popup
    document.addEventListener('pointerdown', function (e) {
      if (!pop || pop.hidden || pop.contains(e.target) || e.target.closest('#rbody')) return;
      Reader.clearSelection();
    }, true);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') Reader.clearSelection(); });
    window.addEventListener('resize', function () { Reader.clearSelection(); });
  }

  /** Copies text to the clipboard (Clipboard API with a textarea fallback). */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy') ? resolve() : reject(new Error('copy')); } catch (e) { reject(e); }
      ta.remove();
    });
  }

  /**
   * Remembers a word that was looked up (not added) and highlights it right away.
   * Only single words are tracked, because marks are applied per word.
   */
  function trackLookup(sel) {
    if (!state.openBookId || !sel || !sel.text || /\s/.test(sel.text)) return;
    var k = Reader.markKey(sel.text);
    if (!k || state.marks.vocab.has(k) || state.marks.looked.has(k)) return;
    state.marks.looked.add(k);
    addLookup(state.openBookId, k).catch(function () {});
    Reader.refreshMarks();
  }

  function handleSelectionAction(action, sel) {
    if (!sel) return;
    var lang = state.currentLangCode || 'en';
    function ext(field) {
      trackLookup(sel);
      db.languages.where('code').equals(lang).first().then(function (l) {
        if (!l || !l[field]) { UI.toast(I18N.t('notConfigured'), 'warn'); return; }
        window.open(l[field].replace('{word}', encodeURIComponent(sel.text)), '_blank');
      });
    }
    if (action === 'internal') {
      trackLookup(sel);
      lookupWord(lang, sel.text).then(function (tr) {
        UI.toast(tr ? sel.text + ' — ' + tr : I18N.t('notFoundDict'), tr ? 'success' : 'warn', tr ? 6000 : 3200);
      });
    } else if (action === 'external') ext('externalDict');
    else if (action === 'translator') ext('externalTranslator');
    else if (action === 'add') openWordModal(sel.text, sel.context, state.openBookId);
    else if (action === 'copy') {
      copyText(sel.text).then(function () { UI.toast(I18N.t('copied'), 'success', 1800); })
        .catch(function () { UI.toast(I18N.t('copyFailed'), 'error'); });
    } else if (action === 'share') {
      if (!navigator.share) { UI.toast(I18N.t('shareNA'), 'warn'); return; }
      navigator.share({ text: sel.text }).catch(function (e) {
        if (e && e.name !== 'AbortError') UI.toast(I18N.t('errorGeneric') + ': ' + e.message, 'error');
      });
    }
  }

  /** Loads the vocabulary + look-ups of a book and hands them to the reader for highlighting. */
  function loadMarks(bookId) {
    return Promise.all([listWordsForBook(bookId), listLookups(bookId)]).then(function (r) {
      var vocab = new Map(), looked = new Set();
      r[0].forEach(function (w) {
        var k = Reader.markKey(w.foreign);
        if (!k || /\s/.test(k)) return; // phrases are not highlighted
        vocab.set(k, w.translation && w.translation !== '-' ? w.translation : '');
      });
      r[1].forEach(function (l) { looked.add(l.word); });
      state.marks = { vocab: vocab, looked: looked };
      Reader.setMarks(state.marks);
    });
  }

  /** Re-reads marks for the open book and repaints the text (after a word was added / deleted). */
  function syncMarks() {
    if (!state.openBookId) return;
    loadMarks(state.openBookId).then(function () { Reader.refreshMarks(); }).catch(function () {});
  }

  /** Shows exactly one of: loading spinner / error fallback / the book. */
  function setReaderState(st, msg) {
    $('readerLoading').hidden = st !== 'loading';
    $('readerError').hidden = st !== 'error';
    if (st === 'error') { $('readerErrorMsg').textContent = msg || ''; $('rtb').classList.remove('hidden'); }
  }

  function openReader(bookId) {
    var id = Number(bookId);
    state.openBookId = id;
    state.lastBookId = id;
    state.pendingProgress = null;
    $('noOpenBook').hidden = true;
    $('readerRoot').hidden = false;
    $('rtb').classList.remove('hidden');
    showTab('read');
    setReaderState('loading');

    var engineTimeout = new Promise(function (_, rej) {
      setTimeout(function () {
        rej(new Error('Reader engine timeout — check that pdf.min.js / epub.min.js / jszip.min.js exist.'));
      }, 20000);
    });

    var opening = loadMarks(id).catch(function () {}).then(function () {
      return Reader.open(id, function (p) {
        state.pendingProgress = Object.assign({}, state.pendingProgress || {}, p);
        var prog = $('rprog');
        if (prog) prog.style.width = Math.round((state.pendingProgress.percentage || 0) * 100) + '%';
        if (state.saveTimer) clearTimeout(state.saveTimer);
        state.saveTimer = setTimeout(function () {
          state.saveTimer = null;
          saveProgress(state.openBookId, state.pendingProgress).catch(function () {});
        }, 400);
      }, function (book) {
        $('rtitle').textContent = book.title;
        if ('wakeLock' in navigator) {
          navigator.wakeLock.request('screen').then(function (l) { state.wakeLock = l; }).catch(function () {});
        }
        state.currentLangCode = 'en';
      });
    });

    Promise.race([opening, engineTimeout]).then(function () {
      if (state.openBookId === id) setReaderState('ok');
    }).catch(function (err) {
      console.error('[reader]', err);
      if (state.openBookId !== id) return;
      setReaderState('error', err && err.message);
      UI.toast(I18N.t('openError'), 'error');
    });
  }

  function closeReader() {
    flushProgress();
    Reader.close();
    setReaderState('ok');
    state.openBookId = null;
    state.pendingProgress = null;
    document.getElementById('readerRoot').hidden = true;
    document.getElementById('noOpenBook').hidden = false;
    if (state.wakeLock) { try { state.wakeLock.release(); } catch (e) {} state.wakeLock = null; }
    try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) {}
    refreshLibrary();
  }

  function toggleOrientation(btn) {
    if (!screen.orientation || !screen.orientation.lock) { UI.toast(I18N.t('orientationNA'), 'warn'); return; }
    var cur = btn.getAttribute('data-mode') || 'auto';
    var next = cur === 'auto' ? 'portrait' : cur === 'portrait' ? 'landscape' : 'auto';
    var apply;
    if (next === 'auto') { try { screen.orientation.unlock(); } catch (e) {} apply = Promise.resolve(); }
    else apply = screen.orientation.lock(next);
    apply.then(function () {
      btn.setAttribute('data-mode', next);
      btn.classList.toggle('active', next !== 'auto');
    }).catch(function () {});
  }

  // ===================== SETTINGS =====================
  function bindSettings() {
    document.querySelectorAll('.chip[data-theme]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = this.getAttribute('data-theme');
        state.settings.theme = t;
        applyTheme(t);
        setSetting('theme', t);
      });
    });
    document.querySelectorAll('.chip[data-mode]').forEach(function (b) {
      b.addEventListener('click', function () {
        var m = this.getAttribute('data-mode');
        state.settings.readingMode = m;
        document.querySelectorAll('.chip[data-mode]').forEach(function (x) {
          x.classList.toggle('chip-active', x.getAttribute('data-mode') === m);
        });
        setSetting('readingMode', m);
        applyReadingMode();
      });
    });
  }

  function bindSettingsEvents() {
    var fsMinus = document.getElementById('fsMinus');
    var fsPlus = document.getElementById('fsPlus');
    var align = document.getElementById('setAlign');
    var lh = document.getElementById('setLineHeight');
    var langSel = document.getElementById('setLang');
    var lp = document.getElementById('setLongPress');

    if (fsMinus) fsMinus.addEventListener('click', function () {
      state.settings.fontSize = Math.max(12, state.settings.fontSize - 1);
      applyFontSettings(); setSetting('fontSize', state.settings.fontSize);
    });
    if (fsPlus) fsPlus.addEventListener('click', function () {
      state.settings.fontSize = Math.min(32, state.settings.fontSize + 1);
      applyFontSettings(); setSetting('fontSize', state.settings.fontSize);
    });
    if (align) align.addEventListener('change', function () {
      state.settings.align = this.value;
      applyFontSettings(); setSetting('align', this.value);
    });
    if (lh) lh.addEventListener('input', function () {
      state.settings.lineHeight = Number(this.value);
      applyFontSettings(); setSetting('lineHeight', state.settings.lineHeight);
    });
    if (langSel) langSel.addEventListener('change', function () {
      state.settings.lang = this.value;
      I18N.set(this.value);
      setSetting('lang', this.value);
      // re-render dynamic, JS-built UI in the new language
      renderSides(); renderQuizHome(); updateSortUI(); updateWordSortUI(); refreshLanguages();
    });
    if (lp) lp.addEventListener('input', function () {
      state.settings.longPressMs = Number(this.value);
      Reader.setLongPressDuration(state.settings.longPressMs);
      applyFontSettings();
      setSetting('longPressMs', state.settings.longPressMs);
    });

    var addLang = document.getElementById('addLanguageBtn');
    if (addLang) addLang.addEventListener('click', openLangModal);
  }

  function renderLangSelect() {
    var sel = document.getElementById('setLang');
    if (!sel) return;
    sel.innerHTML = '';
    I18N.list().forEach(function (code) {
      var opt = document.createElement('option');
      opt.value = code;
      opt.textContent = code.toUpperCase();
      if (code === state.settings.lang) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  function applyReadingMode() {
    var m = state.settings.readingMode;
    document.documentElement.setAttribute('data-reading-mode', m);
    document.querySelectorAll('.chip[data-mode]').forEach(function (b) {
      b.classList.toggle('chip-active', b.getAttribute('data-mode') === m);
    });
    Reader.setReadingMode(m);
  }

  // ===================== LANGUAGES =====================
  function languageName(code) {
    for (var i = 0; i < LANGUAGES.length; i++) if (LANGUAGES[i][0] === code) return LANGUAGES[i][1];
    return code.toUpperCase();
  }

  function refreshLanguages() {
    return listLanguages().then(function (langs) {
      var list = document.getElementById('langList');
      if (!list) return;
      list.innerHTML = '';
      if (!langs.length) {
        list.innerHTML = '<div class="empty" style="padding:20px 0;font-size:13px">' + esc(I18N.t('noLanguages')) + '</div>';
        return;
      }
      langs.forEach(function (l) {
        var row = document.createElement('div');
        row.className = 'word-row';
        row.innerHTML =
          '<div class="word-main"><div class="word-foreign">' + esc(languageName(l.code)) + ' (' + esc(l.code.toUpperCase()) + ')</div>' +
          '<div class="word-sub">' + (l.externalDict ? 'dict' : '—') + ' · ' +
          (l.externalTranslator ? 'translator' : '—') + '</div></div>' +
          '<button class="tbtn" data-del="' + l.id + '" aria-label="Delete">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>' +
          '</button>';
        row.querySelector('[data-del]').addEventListener('click', function () {
          UI.confirm(tf('deleteLangQ', l.code), { danger: true, ok: I18N.t('delete') }).then(function (y) {
            if (y) deleteLanguage(l.id).then(refreshLanguages);
          });
        });
        list.appendChild(row);
      });
    });
  }

  function bindLangModal() {
    var save = document.getElementById('langSave');
    if (!save) return;
    save.addEventListener('click', function () {
      var code = document.getElementById('lCode').value;
      if (!code) { UI.toast(I18N.t('enterLangCode'), 'warn'); return; }
      var extDict = document.getElementById('lExtDict').value.trim();
      var extTrans = document.getElementById('lExtTrans').value.trim();
      var dictFile = document.getElementById('lDict').files[0];
      addLanguage({ code: code, externalDict: extDict, externalTranslator: extTrans })
        .then(function () {
          if (dictFile) return parseDictionaryFile(dictFile).then(function (entries) {
            return saveDictionary(code, entries, dictFile.name);
          });
        })
        .then(function () { window.__closeLangModal(); refreshLanguages(); })
        .catch(function (err) { UI.toast(I18N.t('errorGeneric') + ': ' + err.message, 'error'); });
    });
  }

  /** Opens the "New language" dialog; languages that are already added are shown disabled. */
  function openLangModal() {
    ['lExtDict', 'lExtTrans'].forEach(function (id) {
      var el = document.getElementById(id); if (el) el.value = '';
    });
    var f = document.getElementById('lDict');
    if (f) f.value = '';
    listLanguages().then(function (existing) {
      var have = existing.map(function (l) { return l.code; });
      var sel = document.getElementById('lCode');
      var firstFree = '';
      sel.innerHTML = '';
      LANGUAGES.forEach(function (l) {
        var opt = document.createElement('option');
        opt.value = l[0];
        var added = have.indexOf(l[0]) > -1;
        opt.textContent = l[1] + ' (' + l[0] + ')' + (added ? ' ✓' : '');
        opt.disabled = added;
        if (!added && !firstFree) firstFree = l[0];
        sel.appendChild(opt);
      });
      sel.value = firstFree;
      document.getElementById('langModal').hidden = false;
    });
  }

  function parseDictionaryFile(file) {
    return file.text().then(function (txt) {
      var ext = file.name.split('.').pop().toLowerCase();
      var entries = [];
      if (ext === 'json') {
        try {
          var data = JSON.parse(txt);
          if (Array.isArray(data)) data.forEach(function (it) {
            if (it.word && it.translation) entries.push({ word: it.word, translation: it.translation });
            else if (it.source && it.target) entries.push({ word: it.source, translation: it.target });
          });
          else if (typeof data === 'object') Object.keys(data).forEach(function (k) {
            entries.push({ word: k, translation: String(data[k]) });
          });
        } catch (e) { return []; }
        return entries;
      }
      txt.split(/\r?\n/).forEach(function (line) {
        if (!line.trim()) return;
        var m = line.split(/[\t,;|]/);
        if (m.length >= 2 && m[0].trim() && m[1].trim()) {
          entries.push({ word: m[0].trim(), translation: m[1].trim() });
        }
      });
      return entries;
    });
  }

  // ===================== WORD MODAL =====================
  function bindWordModal() {
    var saveBtn = document.getElementById('wordSave');
    if (!saveBtn) return;
    saveBtn.addEventListener('click', function () {
      var foreign = (document.getElementById('wForeign').value || '').trim() || '-';
      var translation = (document.getElementById('wTranslation').value || '').trim() || '-';
      var context = (document.getElementById('wContext').value || '').trim() || '-';
      var sentenceTranslation = (document.getElementById('wSentenceTranslation').value || '').trim() || '-';
      var bookId = state._wordModalBookId != null ? state._wordModalBookId : state.openBookId;
      addWord({
        foreign: foreign, translation: translation,
        context: context, sentenceTranslation: sentenceTranslation,
        langCode: state.currentLangCode || 'en',
        bookId: bookId
      }).then(function () {
        window.__closeWordModal();
        state._wordModalBookId = null;
        refreshWords();
        syncMarks();
        if (state.dictBookId) refreshDictionaryView();
      }).catch(function (err) { UI.toast(I18N.t('errorGeneric') + ': ' + err.message, 'error'); });
    });
  }

  function openWordModal(word, sentence, bookId) {
    word = word || '-';
    sentence = sentence || '-';
    var lang = state.currentLangCode || 'en';
    state._wordModalBookId = bookId || null;
    lookupWord(lang, word).then(function (autoTr) {
      document.getElementById('wForeign').value = word;
      // Translation defaults to "-" unless the internal dictionary knows the word
      document.getElementById('wTranslation').value = autoTr || '-';
      document.getElementById('wContext').value = sentence;
      document.getElementById('wSentenceTranslation').value = '-';
      document.getElementById('wordModal').hidden = false;
      setTimeout(function () {
        var t = document.getElementById('wTranslation');
        t.focus();
        t.select(); // typing replaces the default "-"
      }, 50);
    });
  }

  // ===================== DICTIONARY VIEW =====================
  function bindDictionaryView() {
    var back = document.getElementById('dictBackBtn');
    var exp = document.getElementById('exportTsvBtn');
    if (back) back.addEventListener('click', function () {
      state.dictBookId = null;
      showTab('library');
    });
    if (exp) exp.addEventListener('click', exportCurrentDictionary);
  }

  function openDictionaryView(bookId) {
    state.dictBookId = Number(bookId);
    showTab('dict');
    getBook(bookId).then(function (b) {
      var t = document.getElementById('dictTitle');
      if (t) t.textContent = b ? b.title : I18N.t('dictTitle');
    });
    refreshDictionaryView();
  }

  function refreshDictionaryView() {
    if (!state.dictBookId) return;
    listWordsForBook(state.dictBookId).then(function (words) {
      var box = document.getElementById('dictList');
      var empty = document.getElementById('emptyDict');
      if (!box) return;
      box.innerHTML = '';
      if (!words.length) {
        if (empty) { box.appendChild(empty); empty.hidden = false; }
        return;
      }
      if (empty) empty.hidden = true;
      words.sort(function (a, b) { return (a.createdAt || 0) - (b.createdAt || 0); });
      words.forEach(function (w) {
        var row = document.createElement('div');
        row.className = 'dict-row';
        row.innerHTML =
          '<div class="dict-cell"><strong>' + esc(w.foreign) + '</strong></div>' +
          '<div class="dict-cell">' + esc(w.translation) + '</div>' +
          '<div class="dict-cell dict-muted">' + esc(w.context) + '</div>' +
          '<div class="dict-cell dict-muted">' + esc(w.sentenceTranslation || '-') + '</div>';
        box.appendChild(row);
      });
    });
  }

  function exportCurrentDictionary() {
    if (!state.dictBookId) return;
    listWordsForBook(state.dictBookId).then(function (words) {
      if (!words.length) { UI.toast(I18N.t('dictEmpty'), 'warn'); return; }
      var lines = words.map(function (w) {
        return [
          cleanTsv(w.foreign),
          cleanTsv(w.translation),
          cleanTsv(w.context),
          cleanTsv(w.sentenceTranslation || '-')
        ].join('\t');
      });
      var blob = new Blob([lines.join('\n')], { type: 'text/tab-separated-values;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      getBook(state.dictBookId).then(function (b) {
        var safeTitle = (b && b.title ? b.title : 'dictionary').replace(/[\\/:*?"<>|]+/g, '_');
        var a = document.createElement('a');
        a.href = url;
        a.download = safeTitle + '.tsv';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 500);
      });
    });
  }

  function cleanTsv(s) {
    return String(s == null ? '' : s).replace(/[\t\r\n]+/g, ' ').trim();
  }

  // ===================== QUIZ =====================
  function bindQuiz() {
    var addWordBtn = $('addWordBtn'), startBtn = $('startQuizBtn'), quitBtn = $('quitQuiz');
    if (addWordBtn) addWordBtn.addEventListener('click', function () {
      openWordModal('-', '-', state.openBookId);
    });
    if (startBtn) startBtn.addEventListener('click', startQuiz);
    if (quitBtn) quitBtn.addEventListener('click', quitQuiz);

    // Word sorting: arrow = order, label = type (same pattern as the bookshelf)
    var ws = $('wordSortBtn');
    if (ws) ws.addEventListener('click', function (e) {
      if (e.target.closest('#wordSortDir')) {
        state.wordSortDir = -state.wordSortDir;
        setSetting('wordSortDir', state.wordSortDir);
      } else {
        state.wordSortKey = state.wordSortKey === 'createdAt' ? 'foreign' : 'createdAt';
        setSetting('wordSortKey', state.wordSortKey);
      }
      updateWordSortUI();
      renderQuizHome();
    });

    // Book menu
    var menu = $('bookMenu');
    $('bookSelBtn').addEventListener('click', function () { menu.hidden = !menu.hidden; });
    document.addEventListener('pointerdown', function (e) {
      if (menu.hidden || menu.contains(e.target) || e.target.closest('#bookSelBtn')) return;
      menu.hidden = true;
    }, true);
    $('booksAll').addEventListener('click', function () { setAllBooks(true); });
    $('booksNone').addEventListener('click', function () { setAllBooks(false); });

    // Word selection
    $('wordsAll').addEventListener('click', function () { setVisibleChecked(true); });
    $('wordsNone').addEventListener('click', function () { setVisibleChecked(false); });
  }

  function updateWordSortUI() {
    var l = $('wordSortLabel'), d = $('wordSortDir');
    if (!l || !d) return;
    l.textContent = state.wordSortKey === 'foreign' ? I18N.t('sortName') : I18N.t('sortAdded');
    d.textContent = state.wordSortDir === -1 ? '↓' : '↑';
  }

  /** Front/back field pickers (two columns). Every side keeps at least one field. */
  function renderSides() {
    [['sideFront', 'cardFront'], ['sideBack', 'cardBack']].forEach(function (p) {
      var box = $(p[0]);
      if (!box) return;
      box.innerHTML = '';
      FIELDS.forEach(function (f) {
        var lab = document.createElement('label');
        lab.className = 'side-opt';
        var chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.checked = state[p[1]].indexOf(f.id) > -1;
        chk.addEventListener('change', function () {
          var next = FIELDS.map(function (x) { return x.id; }).filter(function (id) {
            return id === f.id ? chk.checked : state[p[1]].indexOf(id) > -1;
          });
          if (!next.length) { chk.checked = true; UI.toast(I18N.t('keepOneField'), 'warn'); return; }
          state[p[1]] = next;
          setSetting(p[1], next);
        });
        var span = document.createElement('span');
        span.textContent = I18N.t(f.label);
        lab.appendChild(chk);
        lab.appendChild(span);
        box.appendChild(lab);
      });
    });
  }

  function wkey(w) { return w.bookId == null ? 0 : Number(w.bookId); }

  /** Words of the selected books, ordered by the chosen word sort. */
  function sortedVisible() {
    var q = state.quiz, k = state.wordSortKey, d = state.wordSortDir;
    var arr = q.words.filter(function (w) { return q.books.has(wkey(w)); });
    arr.sort(function (a, b) {
      var r = k === 'foreign'
        ? String(a.foreign).localeCompare(String(b.foreign), undefined, { sensitivity: 'base' })
        : (a.createdAt || 0) - (b.createdAt || 0);
      return r * d;
    });
    return arr;
  }

  /** Reloads words + books, keeps the user's selection and auto-selects new books / words. */
  function refreshWords() {
    return Promise.all([listWords(), listBooks()]).then(function (r) {
      var q = state.quiz, words = r[0];
      q.words = words;
      q.booksList = r[1];
      q.counts = {};
      words.forEach(function (w) { var k = wkey(w); q.counts[k] = (q.counts[k] || 0) + 1; });

      var keys = q.booksList.map(function (b) { return b.id; });
      if (q.counts[0]) keys.push(0);
      keys.forEach(function (k) {
        if (!q.knownBooks.has(k)) { q.knownBooks.add(k); q.books.add(k); }
      });
      Array.from(q.knownBooks).forEach(function (k) {
        if (keys.indexOf(k) < 0) { q.knownBooks.delete(k); q.books.delete(k); }
      });

      var ids = new Set(words.map(function (w) { return w.id; }));
      words.forEach(function (w) {
        if (!q.knownWords.has(w.id)) { q.knownWords.add(w.id); if (q.books.has(wkey(w))) q.checked.add(w.id); }
      });
      Array.from(q.knownWords).forEach(function (id) {
        if (!ids.has(id)) { q.knownWords.delete(id); q.checked.delete(id); }
      });
      renderQuizHome();
    });
  }

  function setAllBooks(on) {
    var q = state.quiz;
    Object.keys(q.counts).concat(q.booksList.map(function (b) { return b.id; })).forEach(function (k) {
      setBookSelected(Number(k), on, true);
    });
    renderQuizHome();
  }

  function setBookSelected(key, on, silent) {
    var q = state.quiz;
    if (on) q.books.add(key); else q.books.delete(key);
    q.words.forEach(function (w) {
      if (wkey(w) !== key) return;
      if (on) q.checked.add(w.id); else q.checked.delete(w.id);
    });
    if (!silent) renderQuizHome();
  }

  function setVisibleChecked(on) {
    var q = state.quiz;
    sortedVisible().forEach(function (w) { if (on) q.checked.add(w.id); else q.checked.delete(w.id); });
    renderQuizHome();
  }

  function renderBookMenu() {
    var q = state.quiz, list = $('bookMenuList'), total = 0, sel = 0;
    list.innerHTML = '';
    var entries = q.booksList.map(function (b) { return { key: b.id, title: b.title }; });
    if (q.counts[0]) entries.push({ key: 0, title: I18N.t('noBook') });
    entries.forEach(function (e) {
      total++;
      if (q.books.has(e.key)) sel++;
      var row = document.createElement('label');
      row.className = 'menu-row';
      row.innerHTML = '<input type="checkbox"' + (q.books.has(e.key) ? ' checked' : '') + '>' +
        '<span class="menu-name">' + esc(e.title) + '</span>' +
        '<span class="menu-count">' + (q.counts[e.key] || 0) + '</span>';
      row.querySelector('input').addEventListener('change', function () { setBookSelected(e.key, this.checked); });
      list.appendChild(row);
    });
    $('bookSelLabel').textContent = I18N.t('books') + ' (' + sel + '/' + total + ')';
  }

  function renderQuizHome() {
    var q = state.quiz, box = $('wordsList');
    if (!box) return;
    var titles = {};
    q.booksList.forEach(function (b) { titles[b.id] = b.title; });
    var vis = sortedVisible(), now = Date.now();

    box.innerHTML = '';
    $('emptyWords').hidden = q.words.length > 0;

    vis.forEach(function (w) {
      var due = (w.due || 0) <= now;
      var row = document.createElement('div');
      row.className = 'word-row';
      row.innerHTML =
        '<input type="checkbox" class="wchk" aria-label="Select word"' + (q.checked.has(w.id) ? ' checked' : '') + '>' +
        '<div class="word-main">' +
          '<div class="word-foreign">' + esc(w.foreign) +
            (due ? ' <span class="word-due' + (w.state === 'new' ? ' new' : '') + '">' + (w.state === 'new' ? 'new' : 'due') + '</span>' : '') +
          '</div>' +
          '<div class="word-sub">' + esc(w.translation) + ' · ' + esc(w.bookId != null && titles[w.bookId] ? titles[w.bookId] : I18N.t('noBook')) + '</div>' +
        '</div>' +
        '<button class="tbtn" type="button" aria-label="Delete">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>' +
        '</button>';
      row.querySelector('.wchk').addEventListener('change', function () {
        if (this.checked) q.checked.add(w.id); else q.checked.delete(w.id);
        updateQuizCounts();
      });
      row.querySelector('.tbtn').addEventListener('click', function () {
        UI.confirm(I18N.t('deleteWordQ'), { danger: true, ok: I18N.t('delete') }).then(function (y) {
          if (y) deleteWord(w.id).then(function () { refreshWords(); syncMarks(); });
        });
      });
      box.appendChild(row);
    });

    renderBookMenu();
    var dueCount = 0;
    q.words.forEach(function (w) { if ((w.due || 0) <= now) dueCount++; });
    $('statTotal').textContent = q.words.length;
    $('statDue').textContent = dueCount;
    updateQuizCounts(vis);
  }

  /** Updates "Start Quiz (N)" and the "Selected n / m" header. */
  function updateQuizCounts(vis) {
    var q = state.quiz;
    vis = vis || sortedVisible();
    var n = vis.filter(function (w) { return q.checked.has(w.id); }).length;
    var sb = $('startQuizBtn');
    sb.textContent = I18N.t('startQuiz') + ' (' + n + ')';
    sb.disabled = n === 0;
    $('wordsHeadCount').textContent = I18N.t('selected') + ': ' + n + ' / ' + vis.length;
  }

  function startQuiz() {
    var q = state.quiz;
    var words = sortedVisible().filter(function (w) { return q.checked.has(w.id); });
    if (!words.length) return;
    state.session = words.map(function (w) { return { word: w }; });
    state.sessionIdx = 0;
    state.sessionResults = [];
    $('bookMenu').hidden = true;
    $('quizHome').hidden = true;
    $('quizSession').hidden = false;
    renderQuestion();
  }

  function renderQuestion() {
    var item = state.session[state.sessionIdx];
    if (!item) return;
    var pt = $('quizProgressText');
    if (pt) pt.textContent = (state.sessionIdx + 1) + ' / ' + state.session.length;
    renderFC(item);
  }

  /** Stacks the enabled fields of one side vertically (word → translation → sentence → sentence translation). */
  function faceHtml(w, ids) {
    var html = FIELDS.filter(function (f) { return ids.indexOf(f.id) > -1; }).map(function (f) {
      var v = w[f.key];
      if (v == null || String(v).trim() === '' || String(v).trim() === '-') return '';
      return '<div class="fc-field ' + f.cls + '">' + esc(v) + '</div>';
    }).join('');
    return html || '<div class="fc-field fc-tr">—</div>';
  }

  function renderFC(item) {
    var w = item.word, revealed = false;
    var body = $('quizBody'), footer = $('quizFooter');
    body.innerHTML = '<div class="flashcard" id="fcCard">' +
      '<div class="fc-face" id="fcFace">' + faceHtml(w, state.cardFront) + '</div>' +
      '<div class="fc-hint" id="fcHint">' + esc(I18N.t('tapReveal')) + '</div></div>' +
      '<div class="fc-actions" id="fcActions" hidden>' +
      '<button class="btn again" data-g="1">' + esc(I18N.t('again')) + '</button>' +
      '<button class="btn hard" data-g="2">' + esc(I18N.t('hard')) + '</button>' +
      '<button class="btn good" data-g="3">' + esc(I18N.t('good')) + '</button>' +
      '<button class="btn easy" data-g="4">' + esc(I18N.t('easy')) + '</button></div>';
    footer.innerHTML = '';
    var card = $('fcCard'), acts = $('fcActions');
    card.addEventListener('click', function () {
      if (revealed) return;
      revealed = true;
      $('fcFace').innerHTML = faceHtml(w, state.cardBack); // flip to the back side
      $('fcHint').hidden = true;
      acts.hidden = false;
    });
    Array.prototype.forEach.call(acts.children, function (btn) {
      btn.addEventListener('click', function () {
        var g = Number(btn.getAttribute('data-g'));
        state.sessionResults.push({ wordId: w.id, correct: g >= 3, grade: g });
        nextQuestion();
      });
    });
  }

  function nextQuestion() {
    state.sessionIdx++;
    if (state.sessionIdx >= state.session.length) finishQuiz();
    else renderQuestion();
  }

  function finishQuiz() {
    var upd = [];
    state.sessionResults.forEach(function (r) {
      if (!r.wordId) return;
      upd.push(db.words.get(r.wordId).then(function (w) {
        if (!w) return;
        return updateWordFSRS(r.wordId, Quiz.scheduleFSRS(w, r.grade));
      }));
    });
    Promise.all(upd).then(function () {
      var good = state.sessionResults.filter(function (r) { return r.correct; }).length;
      $('quizSession').hidden = true;
      $('quizHome').hidden = false;
      refreshWords();
      UI.alert(tf('quizDone', good, state.sessionResults.length));
    });
  }

  function quitQuiz() {
    UI.confirm(I18N.t('quitQuizQ')).then(function (y) {
      if (!y) return;
      state.session = []; state.sessionIdx = 0; state.sessionResults = [];
      $('quizSession').hidden = true;
      $('quizHome').hidden = false;
    });
  }

  // ===================== UTIL =====================
  function $(id) { return document.getElementById(id); }
  /** I18N.t with {0},{1}… placeholders. */
  function tf(key) {
    var out = I18N.t(key);
    for (var i = 1; i < arguments.length; i++) out = out.replace('{' + (i - 1) + '}', arguments[i]);
    return out;
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
})();
