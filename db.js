/* global Dexie */
// IndexedDB layer for ReadTodo (database name kept for backward compatibility with existing installs).
var db = new Dexie('ReaderQuizDB');

db.version(1).stores({
  books:     '++id, title, format, lastOpenedAt',
  files:     'bookId',
  progress:  'bookId',
  bookmarks: '++id, bookId, createdAt',
  settings:  'key'
});

db.version(2).stores({
  words: '++id, foreign, translation, due, createdAt, *tags'
});

db.version(3).stores({
  languages:    '++id, &code',
  dictionaries: '++id, langCode',
  books:        '++id, title, format, lastOpenedAt, cover, favorite',
  words:        '++id, foreign, translation, due, createdAt, langCode, bookId, *tags'
}).upgrade(function (tx) {
  return tx.table('words').toCollection().modify(function (w) {
    if (!w.langCode) w.langCode = 'en';
    if (typeof w.bookId === 'undefined') w.bookId = null;
  });
});

// v4: "addedAt" index for sorting, and "lookups" (words looked up but not added to the vocabulary)
db.version(4).stores({
  books:   '++id, title, format, lastOpenedAt, addedAt, cover, favorite',
  lookups: '[bookId+word], bookId'
}).upgrade(function (tx) {
  return tx.table('books').toCollection().modify(function (b) {
    if (!b.addedAt) b.addedAt = b.lastOpenedAt || Date.now();
  });
});

function enforcePersistentStorage() {
  if (!navigator.storage || !navigator.storage.persist) {
    return Promise.resolve({ supported: false, persisted: false });
  }
  return navigator.storage.persisted().then(function (p) {
    if (p) return { supported: true, persisted: true };
    return navigator.storage.persist().then(function (granted) {
      return { supported: true, persisted: granted };
    });
  }).catch(function () { return { supported: true, persisted: false }; });
}

// ===================== BOOKS =====================
function saveBook(file) {
  return file.arrayBuffer().then(function (buf) {
    var ext = file.name.split('.').pop().toLowerCase();
    var title = file.name.replace(/\.[^/.]+$/, '');
    return db.transaction('rw', db.books, db.files, db.progress, function () {
      return db.books.add({
        title: title, format: ext, size: file.size,
        addedAt: Date.now(), lastOpenedAt: Date.now(),
        cover: null, favorite: false
      }).then(function (id) {
        return db.files.put({ bookId: id, data: buf }).then(function () {
          return db.progress.put({ bookId: id, percentage: 0, location: 1, updatedAt: Date.now() })
            .then(function () { return id; });
        });
      });
    });
  });
}

function listBooks() { return db.books.orderBy('lastOpenedAt').reverse().toArray(); }
function getBook(id) { return db.books.get(Number(id)); }
function getBookFile(id) { return db.files.get(Number(id)); }
function getProgress(id) { return db.progress.get(Number(id)); }

function saveProgress(id, patch) {
  var bid = Number(id);
  return db.progress.get(bid).then(function (p) {
    p = p || { bookId: bid, percentage: 0, location: 1 };
    for (var k in patch) if (patch.hasOwnProperty(k)) p[k] = patch[k];
    p.updatedAt = Date.now();
    return db.progress.put(p).then(function () {
      return db.books.update(bid, { lastOpenedAt: Date.now() });
    });
  });
}

function saveBookCover(id, dataUrl) {
  return db.books.update(Number(id), { cover: dataUrl });
}

function setBookFavorite(id, value) {
  return db.books.update(Number(id), { favorite: !!value });
}

function deleteBook(id) {
  var bid = Number(id);
  return db.transaction('rw', db.books, db.files, db.progress, db.bookmarks, db.words, db.lookups, function () {
    return db.books.delete(bid)
      .then(function () { return db.files.delete(bid); })
      .then(function () { return db.progress.delete(bid); })
      .then(function () { return db.bookmarks.where('bookId').equals(bid).delete(); })
      .then(function () { return db.lookups.where('bookId').equals(bid).delete(); })
      .then(function () { return db.words.where('bookId').equals(bid).delete(); });
  });
}

function listBookmarks() { return db.bookmarks.orderBy('createdAt').reverse().toArray(); }
function addBookmark(bookId, label, percentage, cfi) {
  var bid = Number(bookId);
  return db.books.get(bid).then(function (b) {
    return db.bookmarks.add({
      bookId: bid, bookTitle: b ? b.title : 'Unknown',
      label: label, percentage: percentage || 0,
      cfi: cfi || null, createdAt: Date.now()
    });
  });
}
function removeBookmark(id) { return db.bookmarks.delete(Number(id)); }

// ===================== SETTINGS =====================
function getSetting(key, fb) {
  return db.settings.get(key).then(function (r) { return r ? r.value : fb; });
}
function setSetting(key, value) { return db.settings.put({ key: key, value: value }); }

// ===================== WORDS =====================
function addWord(data) {
  return db.words.add({
    foreign: String(data.foreign || '').trim() || '-',
    translation: String(data.translation || '').trim() || '-',
    context: String(data.context || '').trim() || '-',
    sentenceTranslation: String(data.sentenceTranslation || '').trim() || '-',
    langCode: String(data.langCode || 'en').toLowerCase(),
    bookId: (data.bookId != null) ? Number(data.bookId) : null,
    createdAt: Date.now(),
    due: Date.now(),
    stability: 0, difficulty: 5, reps: 0, lapses: 0,
    lastReview: 0, state: 'new'
  });
}

function listWords() { return db.words.orderBy('createdAt').reverse().toArray(); }
function listWordsForBook(bookId) {
  return db.words.where('bookId').equals(Number(bookId)).toArray();
}
function deleteWord(id) { return db.words.delete(Number(id)); }

function getDueWords(limit) {
  var now = Date.now();
  return db.words.toArray().then(function (all) {
    var due = all.filter(function (w) { return (w.due || 0) <= now; });
    due.sort(function (a, b) { return (a.due || 0) - (b.due || 0); });
    return limit ? due.slice(0, limit) : due;
  });
}

function countDue() {
  var now = Date.now();
  return db.words.toArray().then(function (all) {
    var n = 0; all.forEach(function (w) { if ((w.due || 0) <= now) n++; });
    return n;
  });
}

function countWords() { return db.words.count(); }
function updateWordFSRS(id, patch) { return db.words.update(Number(id), patch); }

// ===================== LOOKUPS (dictionary look-ups that were not added to the vocabulary) =====================
function addLookup(bookId, word) {
  return db.lookups.put({ bookId: Number(bookId), word: String(word).toLowerCase(), createdAt: Date.now() });
}
function listLookups(bookId) { return db.lookups.where('bookId').equals(Number(bookId)).toArray(); }

// ===================== LANGUAGES / DICTIONARIES =====================
function listLanguages() { return db.languages.orderBy('code').toArray(); }

function addLanguage(data) {
  return db.languages.add({
    code: String(data.code || '').toLowerCase().trim(),
    externalDict: String(data.externalDict || '').trim(),
    externalTranslator: String(data.externalTranslator || '').trim(),
    createdAt: Date.now()
  });
}

function updateLanguage(id, patch) { return db.languages.update(Number(id), patch); }
function deleteLanguage(id) {
  return db.transaction('rw', db.languages, db.dictionaries, function () {
    return db.languages.get(Number(id)).then(function (l) {
      return db.languages.delete(Number(id)).then(function () {
        return l ? db.dictionaries.where('langCode').equals(l.code).delete() : 0;
      });
    });
  });
}

function saveDictionary(langCode, entries, source) {
  // Replace any previous dictionary of this language
  return db.dictionaries.where('langCode').equals(langCode).delete().then(function () {
    return db.dictionaries.add({ langCode: langCode, entries: entries, source: source || '' });
  });
}
function getDictionary(langCode) {
  return db.dictionaries.where('langCode').equals(langCode).first();
}
function lookupWord(langCode, word) {
  return getDictionary(langCode).then(function (d) {
    if (!d) return null;
    var w = String(word).trim().toLowerCase();
    for (var i = 0; i < d.entries.length; i++) {
      if (String(d.entries[i].word).toLowerCase() === w) return d.entries[i].translation;
    }
    return null;
  });
}
