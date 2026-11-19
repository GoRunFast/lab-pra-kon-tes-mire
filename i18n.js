/* ReadTodo i18n: 14 interface languages, English by default. Missing keys fall back to English. */
var I18N = (function () {

  var dict = {
    en: {
      bookshelf: 'Bookshelf', read: 'Read', quiz: 'Quiz', settings: 'Settings',
      emptyLibrary: 'Library is empty. Tap the add-book button to add a book.',
      noBookOpen: 'No book open.', chooseFromLibrary: 'Choose a book from the Bookshelf.',
      addWord: '+ Word', startQuiz: 'Start Quiz', emptyWords: 'Add words to review.',
      words: 'Words', dueWords: 'Due',
      language: 'Interface language',
      fontSettings: 'Font settings', fontSize: 'Size', align: 'Align',
      alignLeft: 'Left', alignJustify: 'Justify', alignCenter: 'Center',
      lineHeight: 'Line spacing',
      readingMode: 'Reading mode', modePage: 'Page', modeScroll: 'Scroll',
      theme: 'Theme', themeLight: 'Light', themeSepia: 'Sepia', themeDark: 'Dark', themeAmoled: 'AMOLED',
      studyLanguages: 'Study languages', addLanguage: '+ Add language',
      storageInfo: 'Storage',
      newLanguage: 'New language', languageName: 'Language',
      internalDictionary: 'Internal dictionary (.json, .csv, .txt)',
      externalDict: 'External dictionary app (URL scheme)',
      externalTranslator: 'External translator (URL scheme)',
      newWord: 'New word', wordField: 'Word', translationField: 'Translation',
      contextField: 'Context (sentence)', sentenceTranslation: 'Sentence translation',
      save: 'Save', cancel: 'Cancel',
      deleteBook: 'Delete', delete: 'Delete',
      noWords: 'No words yet.',
      longPress: 'Long-Press Duration (ms)',
      ok: 'OK', confirmTitle: 'Confirm', loading: 'Loading…', retry: 'Retry', back: 'Back',
      importError: 'Import failed', unsupportedFile: 'Unsupported file type. Use PDF, EPUB, FB2 or TXT.',
      openError: 'Could not open this book', bookmarkAdded: 'Bookmark added',
      notFoundDict: 'Not found in the internal dictionary.', notConfigured: 'Not configured for this language.',
      orientationNA: 'Orientation lock is not supported.', enterLangCode: 'Choose a language.',
      errorGeneric: 'Error', dictEmpty: 'Dictionary is empty.',
      deleteBookQ: 'Delete “{0}”?', deleteLangQ: 'Delete language {0}?', deleteWordQ: 'Delete this word?',
      quitQuizQ: 'Quit the quiz?', quizDone: 'Done: {0} / {1}',
      copied: 'Copied to clipboard', copyFailed: 'Could not copy', shareNA: 'Sharing is not supported on this device.',
      books: 'Books', selectAll: 'Select all', deselectAll: 'Deselect all', noBook: 'No book',
      cardSides: 'Card sides', cardFront: 'Front', cardBack: 'Back',
      fieldWord: 'Word', fieldWordTr: 'Word translation', fieldSentence: 'Example sentence', fieldSentenceTr: 'Example translation',
      keepOneField: 'Each side needs at least one field.', tapReveal: 'Tap to reveal',
      again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy', selected: 'Selected',
      dictTitle: 'Book dictionary', sortAdded: 'Added', sortTitle: 'Title', sortName: 'Name', noLanguages: 'No languages yet.'
    },
    ru: {
      bookshelf: 'Библиотека', read: 'Читать', quiz: 'Квиз', settings: 'Настройки',
      emptyLibrary: 'Библиотека пуста. Нажмите кнопку добавления, чтобы добавить книгу.',
      noBookOpen: 'Книга не открыта.', chooseFromLibrary: 'Выберите книгу во вкладке «Библиотека».',
      addWord: '+ Слово', startQuiz: 'Начать квиз', emptyWords: 'Добавьте слова для повторения.',
      words: 'Слов', dueWords: 'К повторению',
      language: 'Язык интерфейса',
      fontSettings: 'Настройки шрифта', fontSize: 'Размер', align: 'Выравнивание',
      alignLeft: 'По левому', alignJustify: 'По ширине', alignCenter: 'По центру',
      lineHeight: 'Межстрочный',
      readingMode: 'Режим чтения', modePage: 'Постранично', modeScroll: 'Прокрутка',
      theme: 'Тема', themeLight: 'Светлая', themeSepia: 'Папирус', themeDark: 'Тёмная', themeAmoled: 'Чёрная',
      studyLanguages: 'Изучаемые языки', addLanguage: '+ Добавить язык',
      storageInfo: 'Хранилище',
      newLanguage: 'Новый язык', languageName: 'Язык',
      internalDictionary: 'Внутренний словарь (.json, .csv, .txt)',
      externalDict: 'Внешнее приложение-словарь (URL-схема)',
      externalTranslator: 'Внешний переводчик (URL-схема)',
      newWord: 'Новое слово', wordField: 'Слово', translationField: 'Перевод',
      contextField: 'Контекст (предложение)', sentenceTranslation: 'Перевод предложения',
      save: 'Сохранить', cancel: 'Отмена',
      deleteBook: 'Удалить', delete: 'Удалить',
      noWords: 'Слов пока нет.',
      longPress: 'Длительность долгого нажатия (мс)',
      ok: 'ОК', confirmTitle: 'Подтверждение', loading: 'Загрузка…', retry: 'Повторить', back: 'Назад',
      importError: 'Ошибка импорта', unsupportedFile: 'Неподдерживаемый формат. Используйте PDF, EPUB, FB2 или TXT.',
      openError: 'Не удалось открыть книгу', bookmarkAdded: 'Закладка добавлена',
      notFoundDict: 'Не найдено во внутреннем словаре.', notConfigured: 'Не настроено для этого языка.',
      orientationNA: 'Блокировка ориентации не поддерживается.', enterLangCode: 'Выберите язык.',
      errorGeneric: 'Ошибка', dictEmpty: 'Словарь пуст.',
      deleteBookQ: 'Удалить «{0}»?', deleteLangQ: 'Удалить язык {0}?', deleteWordQ: 'Удалить слово?',
      quitQuizQ: 'Выйти из квиза?', quizDone: 'Готово: {0} / {1}',
      copied: 'Скопировано', books: 'Книги', selectAll: 'Выбрать все', deselectAll: 'Снять выбор'
    },
    ar: {
      bookshelf: 'المكتبة', read: 'قراءة', quiz: 'اختبار', settings: 'الإعدادات',
      emptyLibrary: 'المكتبة فارغة. اضغط على زر الإضافة لإضافة كتاب.',
      noBookOpen: 'لم يتم فتح كتاب.', chooseFromLibrary: 'اختر كتابًا من المكتبة.',
      addWord: '+ كلمة', startQuiz: 'ابدأ الاختبار', emptyWords: 'أضف كلمات للمراجعة.',
      words: 'كلمات', dueWords: 'مستحقة',
      language: 'لغة الواجهة', fontSettings: 'إعدادات الخط', fontSize: 'الحجم',
      align: 'محاذاة', alignLeft: 'يسار', alignJustify: 'تبرير', alignCenter: 'وسط',
      lineHeight: 'تباعد الأسطر',
      readingMode: 'وضع القراءة', modePage: 'صفحة', modeScroll: 'تمرير',
      theme: 'المظهر', themeLight: 'فاتح', themeSepia: 'بابيروس', themeDark: 'داكن', themeAmoled: 'أسود',
      studyLanguages: 'لغات الدراسة', addLanguage: '+ إضافة لغة',
      storageInfo: 'التخزين', newLanguage: 'لغة جديدة', languageName: 'اللغة',
      internalDictionary: 'قاموس داخلي', externalDict: 'قاموس خارجي (URL)',
      externalTranslator: 'مترجم خارجي (URL)',
      newWord: 'كلمة جديدة', wordField: 'كلمة', translationField: 'ترجمة',
      contextField: 'سياق', sentenceTranslation: 'ترجمة الجملة',
      save: 'حفظ', cancel: 'إلغاء', deleteBook: 'حذف', delete: 'حذف', noWords: 'لا كلمات بعد.'
    },
    zh: {
      bookshelf: '书架', read: '阅读', quiz: '测验', settings: '设置',
      emptyLibrary: '书架为空。点击添加按钮添加书籍。',
      noBookOpen: '未打开书籍。', chooseFromLibrary: '从书架中选择书籍。',
      addWord: '+ 单词', startQuiz: '开始测验', emptyWords: '添加单词以便复习。',
      words: '单词', dueWords: '待复习',
      language: '界面语言', fontSettings: '字体设置', fontSize: '大小',
      align: '对齐', alignLeft: '左', alignJustify: '两端', alignCenter: '中',
      lineHeight: '行距',
      readingMode: '阅读模式', modePage: '翻页', modeScroll: '滚动',
      theme: '主题', themeLight: '浅色', themeSepia: '羊皮纸', themeDark: '深色', themeAmoled: '黑色',
      studyLanguages: '学习语言', addLanguage: '+ 添加语言',
      storageInfo: '存储', newLanguage: '新语言', languageName: '语言',
      internalDictionary: '内部词典', externalDict: '外部词典 (URL)',
      externalTranslator: '外部翻译 (URL)',
      newWord: '新单词', wordField: '单词', translationField: '翻译',
      contextField: '上下文', sentenceTranslation: '句子翻译',
      save: '保存', cancel: '取消', deleteBook: '删除', delete: '删除', noWords: '暂无单词。'
    },
    fr: {
      bookshelf: 'Bibliothèque', read: 'Lire', quiz: 'Quiz', settings: 'Paramètres',
      emptyLibrary: 'Bibliothèque vide. Appuyez sur le bouton d\'ajout.',
      noBookOpen: 'Aucun livre ouvert.', chooseFromLibrary: 'Choisissez un livre.',
      addWord: '+ Mot', startQuiz: 'Démarrer', emptyWords: 'Ajoutez des mots à réviser.',
      words: 'Mots', dueWords: 'À réviser',
      language: 'Langue de l\'interface', fontSettings: 'Police', fontSize: 'Taille',
      align: 'Alignement', alignLeft: 'Gauche', alignJustify: 'Justifié', alignCenter: 'Centré',
      lineHeight: 'Interligne',
      readingMode: 'Mode de lecture', modePage: 'Page', modeScroll: 'Défilement',
      theme: 'Thème', themeLight: 'Clair', themeSepia: 'Sépia', themeDark: 'Sombre', themeAmoled: 'AMOLED',
      studyLanguages: 'Langues étudiées', addLanguage: '+ Ajouter',
      storageInfo: 'Stockage', newLanguage: 'Nouvelle langue', languageName: 'Langue',
      internalDictionary: 'Dictionnaire interne', externalDict: 'Dictionnaire externe (URL)',
      externalTranslator: 'Traducteur externe (URL)',
      newWord: 'Nouveau mot', wordField: 'Mot', translationField: 'Traduction',
      contextField: 'Contexte', sentenceTranslation: 'Traduction de la phrase',
      save: 'Enregistrer', cancel: 'Annuler', deleteBook: 'Supprimer', delete: 'Supprimer', noWords: 'Pas encore de mots.'
    },
    de: {
      bookshelf: 'Bücherregal', read: 'Lesen', quiz: 'Quiz', settings: 'Einstellungen',
      emptyLibrary: 'Regal ist leer. Tippe auf die Schaltfläche zum Hinzufügen.',
      noBookOpen: 'Kein Buch geöffnet.', chooseFromLibrary: 'Wähle ein Buch.',
      addWord: '+ Wort', startQuiz: 'Quiz starten', emptyWords: 'Füge Wörter hinzu.',
      words: 'Wörter', dueWords: 'Fällig',
      language: 'Sprache', fontSettings: 'Schrift', fontSize: 'Größe',
      align: 'Ausrichtung', alignLeft: 'Links', alignJustify: 'Blocksatz', alignCenter: 'Mitte',
      lineHeight: 'Zeilenabstand',
      readingMode: 'Lesemodus', modePage: 'Seite', modeScroll: 'Scrollen',
      theme: 'Thema', themeLight: 'Hell', themeSepia: 'Sepia', themeDark: 'Dunkel', themeAmoled: 'AMOLED',
      studyLanguages: 'Lernsprachen', addLanguage: '+ Sprache',
      storageInfo: 'Speicher', newLanguage: 'Neue Sprache', languageName: 'Sprache',
      internalDictionary: 'Internes Wörterbuch', externalDict: 'Externes Wörterbuch (URL)',
      externalTranslator: 'Externer Übersetzer (URL)',
      newWord: 'Neues Wort', wordField: 'Wort', translationField: 'Übersetzung',
      contextField: 'Kontext', sentenceTranslation: 'Satzübersetzung',
      save: 'Speichern', cancel: 'Abbrechen', deleteBook: 'Löschen', delete: 'Löschen', noWords: 'Noch keine Wörter.'
    },
    hi: {
      bookshelf: 'पुस्तकालय', read: 'पढ़ें', quiz: 'प्रश्नोत्तरी', settings: 'सेटिंग्स',
      emptyLibrary: 'पुस्तकालय खाली है। जोड़ें बटन पर टैप करें।',
      noBookOpen: 'कोई पुस्तक नहीं खुली।', chooseFromLibrary: 'पुस्तक चुनें।',
      addWord: '+ शब्द', startQuiz: 'प्रश्नोत्तरी शुरू', emptyWords: 'शब्द जोड़ें।',
      words: 'शब्द', dueWords: 'देय',
      language: 'भाषा', fontSettings: 'फ़ॉन्ट', fontSize: 'आकार',
      align: 'संरेखण', alignLeft: 'बाएं', alignJustify: 'समर्थन', alignCenter: 'केंद्र',
      lineHeight: 'पंक्ति रिक्ति',
      readingMode: 'पठन मोड', modePage: 'पृष्ठ', modeScroll: 'स्क्रॉल',
      theme: 'थीम', themeLight: 'लाइट', themeSepia: 'सेपिया', themeDark: 'डार्क', themeAmoled: 'AMOLED',
      studyLanguages: 'अध्ययन भाषाएं', addLanguage: '+ भाषा जोड़ें',
      storageInfo: 'भंडारण', newLanguage: 'नई भाषा', languageName: 'भाषा',
      internalDictionary: 'आंतरिक शब्दकोश', externalDict: 'बाहरी शब्दकोश (URL)',
      externalTranslator: 'बाहरी अनुवादक (URL)',
      newWord: 'नया शब्द', wordField: 'शब्द', translationField: 'अनुवाद',
      contextField: 'संदर्भ', sentenceTranslation: 'वाक्य अनुवाद',
      save: 'सहेजें', cancel: 'रद्द करें', deleteBook: 'हटाएं', delete: 'हटाएं', noWords: 'अभी कोई शब्द नहीं।'
    },
    it: {
      bookshelf: 'Libreria', read: 'Leggi', quiz: 'Quiz', settings: 'Impostazioni',
      emptyLibrary: 'Libreria vuota. Tocca il pulsante di aggiunta.',
      noBookOpen: 'Nessun libro aperto.', chooseFromLibrary: 'Scegli un libro.',
      addWord: '+ Parola', startQuiz: 'Inizia quiz', emptyWords: 'Aggiungi parole.',
      words: 'Parole', dueWords: 'Da rivedere',
      language: 'Lingua', fontSettings: 'Carattere', fontSize: 'Dimensione',
      align: 'Allineamento', alignLeft: 'Sinistra', alignJustify: 'Giustificato', alignCenter: 'Centro',
      lineHeight: 'Interlinea',
      readingMode: 'Modalità', modePage: 'Pagina', modeScroll: 'Scorrimento',
      theme: 'Tema', themeLight: 'Chiaro', themeSepia: 'Seppia', themeDark: 'Scuro', themeAmoled: 'AMOLED',
      studyLanguages: 'Lingue di studio', addLanguage: '+ Lingua',
      storageInfo: 'Archiviazione', newLanguage: 'Nuova lingua', languageName: 'Lingua',
      internalDictionary: 'Dizionario interno', externalDict: 'Dizionario esterno (URL)',
      externalTranslator: 'Traduttore esterno (URL)',
      newWord: 'Nuova parola', wordField: 'Parola', translationField: 'Traduzione',
      contextField: 'Contesto', sentenceTranslation: 'Traduzione frase',
      save: 'Salva', cancel: 'Annulla', deleteBook: 'Elimina', delete: 'Elimina', noWords: 'Ancora nessuna parola.'
    },
    ja: {
      bookshelf: '本棚', read: '読む', quiz: 'クイズ', settings: '設定',
      emptyLibrary: '本棚は空です。追加ボタンをタップ。',
      noBookOpen: '本が開かれていません。', chooseFromLibrary: '本棚から選んでください。',
      addWord: '+ 単語', startQuiz: 'クイズ開始', emptyWords: '単語を追加してください。',
      words: '単語', dueWords: '復習待ち',
      language: '言語', fontSettings: 'フォント', fontSize: 'サイズ',
      align: '配置', alignLeft: '左', alignJustify: '両端', alignCenter: '中央',
      lineHeight: '行間',
      readingMode: '閲覧モード', modePage: 'ページ', modeScroll: 'スクロール',
      theme: 'テーマ', themeLight: 'ライト', themeSepia: 'セピア', themeDark: 'ダーク', themeAmoled: 'AMOLED',
      studyLanguages: '学習言語', addLanguage: '+ 言語',
      storageInfo: 'ストレージ', newLanguage: '新しい言語', languageName: '言語',
      internalDictionary: '内部辞書', externalDict: '外部辞書 (URL)',
      externalTranslator: '外部翻訳 (URL)',
      newWord: '新しい単語', wordField: '単語', translationField: '翻訳',
      contextField: '文脈', sentenceTranslation: '文の翻訳',
      save: '保存', cancel: 'キャンセル', deleteBook: '削除', delete: '削除', noWords: '単語はまだありません。'
    },
    ko: {
      bookshelf: '책장', read: '읽기', quiz: '퀴즈', settings: '설정',
      emptyLibrary: '책장이 비어 있습니다. 추가 버튼을 탭하세요.',
      noBookOpen: '열린 책이 없습니다.', chooseFromLibrary: '책장에서 선택하세요.',
      addWord: '+ 단어', startQuiz: '퀴즈 시작', emptyWords: '단어를 추가하세요.',
      words: '단어', dueWords: '복습 대기',
      language: '언어', fontSettings: '글꼴', fontSize: '크기',
      align: '정렬', alignLeft: '왼쪽', alignJustify: '양쪽', alignCenter: '가운데',
      lineHeight: '줄 간격',
      readingMode: '읽기 모드', modePage: '페이지', modeScroll: '스크롤',
      theme: '테마', themeLight: '라이트', themeSepia: '세피아', themeDark: '다크', themeAmoled: 'AMOLED',
      studyLanguages: '학습 언어', addLanguage: '+ 언어',
      storageInfo: '저장소', newLanguage: '새 언어', languageName: '언어',
      internalDictionary: '내부 사전', externalDict: '외부 사전 (URL)',
      externalTranslator: '외부 번역기 (URL)',
      newWord: '새 단어', wordField: '단어', translationField: '번역',
      contextField: '문맥', sentenceTranslation: '문장 번역',
      save: '저장', cancel: '취소', deleteBook: '삭제', delete: '삭제', noWords: '아직 단어가 없습니다.'
    },
    pt: {
      bookshelf: 'Estante', read: 'Ler', quiz: 'Quiz', settings: 'Configurações',
      emptyLibrary: 'Estante vazia. Toque no botão de adicionar.',
      noBookOpen: 'Nenhum livro aberto.', chooseFromLibrary: 'Escolha um livro.',
      addWord: '+ Palavra', startQuiz: 'Iniciar quiz', emptyWords: 'Adicione palavras.',
      words: 'Palavras', dueWords: 'Pendentes',
      language: 'Idioma', fontSettings: 'Fonte', fontSize: 'Tamanho',
      align: 'Alinhamento', alignLeft: 'Esquerda', alignJustify: 'Justificado', alignCenter: 'Centro',
      lineHeight: 'Espaçamento',
      readingMode: 'Modo de leitura', modePage: 'Página', modeScroll: 'Rolagem',
      theme: 'Tema', themeLight: 'Claro', themeSepia: 'Sépia', themeDark: 'Escuro', themeAmoled: 'AMOLED',
      studyLanguages: 'Idiomas de estudo', addLanguage: '+ Idioma',
      storageInfo: 'Armazenamento', newLanguage: 'Novo idioma', languageName: 'Idioma',
      internalDictionary: 'Dicionário interno', externalDict: 'Dicionário externo (URL)',
      externalTranslator: 'Tradutor externo (URL)',
      newWord: 'Nova palavra', wordField: 'Palavra', translationField: 'Tradução',
      contextField: 'Contexto', sentenceTranslation: 'Tradução da frase',
      save: 'Salvar', cancel: 'Cancelar', deleteBook: 'Excluir', delete: 'Excluir', noWords: 'Ainda sem palavras.'
    },
    es: {
      bookshelf: 'Estantería', read: 'Leer', quiz: 'Quiz', settings: 'Ajustes',
      emptyLibrary: 'Estantería vacía. Pulsa el botón de añadir.',
      noBookOpen: 'Ningún libro abierto.', chooseFromLibrary: 'Elige un libro.',
      addWord: '+ Palabra', startQuiz: 'Iniciar quiz', emptyWords: 'Añade palabras.',
      words: 'Palabras', dueWords: 'Pendientes',
      language: 'Idioma', fontSettings: 'Fuente', fontSize: 'Tamaño',
      align: 'Alineación', alignLeft: 'Izquierda', alignJustify: 'Justificado', alignCenter: 'Centro',
      lineHeight: 'Interlineado',
      readingMode: 'Modo de lectura', modePage: 'Página', modeScroll: 'Desplazamiento',
      theme: 'Tema', themeLight: 'Claro', themeSepia: 'Sepia', themeDark: 'Oscuro', themeAmoled: 'AMOLED',
      studyLanguages: 'Idiomas de estudio', addLanguage: '+ Idioma',
      storageInfo: 'Almacenamiento', newLanguage: 'Nuevo idioma', languageName: 'Idioma',
      internalDictionary: 'Diccionario interno', externalDict: 'Diccionario externo (URL)',
      externalTranslator: 'Traductor externo (URL)',
      newWord: 'Nueva palabra', wordField: 'Palabra', translationField: 'Traducción',
      contextField: 'Contexto', sentenceTranslation: 'Traducción de la frase',
      save: 'Guardar', cancel: 'Cancelar', deleteBook: 'Eliminar', delete: 'Eliminar', noWords: 'Aún no hay palabras.'
    },
    tr: {
      bookshelf: 'Kitaplık', read: 'Oku', quiz: 'Sınav', settings: 'Ayarlar',
      emptyLibrary: 'Kitaplık boş. Ekle düğmesine dokunun.',
      noBookOpen: 'Açık kitap yok.', chooseFromLibrary: 'Bir kitap seçin.',
      addWord: '+ Kelime', startQuiz: 'Sınavı başlat', emptyWords: 'Kelime ekleyin.',
      words: 'Kelime', dueWords: 'Tekrar',
      language: 'Dil', fontSettings: 'Yazı tipi', fontSize: 'Boyut',
      align: 'Hizalama', alignLeft: 'Sol', alignJustify: 'İki yana', alignCenter: 'Orta',
      lineHeight: 'Satır aralığı',
      readingMode: 'Okuma modu', modePage: 'Sayfa', modeScroll: 'Kaydırma',
      theme: 'Tema', themeLight: 'Açık', themeSepia: 'Sepya', themeDark: 'Koyu', themeAmoled: 'AMOLED',
      studyLanguages: 'Öğrenilen diller', addLanguage: '+ Dil',
      storageInfo: 'Depolama', newLanguage: 'Yeni dil', languageName: 'Dil',
      internalDictionary: 'Dahili sözlük', externalDict: 'Harici sözlük (URL)',
      externalTranslator: 'Harici çevirmen (URL)',
      newWord: 'Yeni kelime', wordField: 'Kelime', translationField: 'Çeviri',
      contextField: 'Bağlam', sentenceTranslation: 'Cümle çevirisi',
      save: 'Kaydet', cancel: 'İptal', deleteBook: 'Sil', delete: 'Sil', noWords: 'Henüz kelime yok.'
    },
    vi: {
      bookshelf: 'Giá sách', read: 'Đọc', quiz: 'Trắc nghiệm', settings: 'Cài đặt',
      emptyLibrary: 'Giá sách trống. Nhấn nút thêm sách.',
      noBookOpen: 'Chưa mở sách nào.', chooseFromLibrary: 'Chọn sách từ Giá sách.',
      addWord: '+ Từ', startQuiz: 'Bắt đầu', emptyWords: 'Thêm từ để ôn.',
      words: 'Từ', dueWords: 'Cần ôn',
      language: 'Ngôn ngữ', fontSettings: 'Phông chữ', fontSize: 'Cỡ chữ',
      align: 'Căn lề', alignLeft: 'Trái', alignJustify: 'Đều', alignCenter: 'Giữa',
      lineHeight: 'Giãn dòng',
      readingMode: 'Chế độ đọc', modePage: 'Trang', modeScroll: 'Cuộn',
      theme: 'Chủ đề', themeLight: 'Sáng', themeSepia: 'Sepia', themeDark: 'Tối', themeAmoled: 'AMOLED',
      studyLanguages: 'Ngôn ngữ học', addLanguage: '+ Ngôn ngữ',
      storageInfo: 'Lưu trữ', newLanguage: 'Ngôn ngữ mới', languageName: 'Ngôn ngữ',
      internalDictionary: 'Từ điển nội bộ', externalDict: 'Từ điển ngoài (URL)',
      externalTranslator: 'Dịch ngoài (URL)',
      newWord: 'Từ mới', wordField: 'Từ', translationField: 'Bản dịch',
      contextField: 'Ngữ cảnh', sentenceTranslation: 'Dịch câu',
      save: 'Lưu', cancel: 'Hủy', deleteBook: 'Xóa', delete: 'Xóa', noWords: 'Chưa có từ nào.'
    }
  };

  var current = 'en';

  /** The interface is English by default; a language chosen in Settings is applied from stored settings. */
  function detect() { return 'en'; }

  function set(lang) {
    current = dict[lang] ? lang : 'en';
    document.documentElement.setAttribute('lang', current);
    document.documentElement.setAttribute('dir', current === 'ar' ? 'rtl' : 'ltr');
    applyToDOM();
    return current;
  }

  function t(key) {
    var d = dict[current] || dict.en;
    return d[key] != null ? d[key] : (dict.en[key] != null ? dict.en[key] : key);
  }

  function applyToDOM() {
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = t(nodes[i].getAttribute('data-i18n'));
    }
    var phNodes = document.querySelectorAll('[data-i18n-ph]');
    for (var j = 0; j < phNodes.length; j++) {
      phNodes[j].setAttribute('placeholder', t(phNodes[j].getAttribute('data-i18n-ph')));
    }
  }

  function list() { return Object.keys(dict); }
  function get() { return current; }

  return { t: t, set: set, detect: detect, list: list, get: get, applyToDOM: applyToDOM };
})();

function t(key) { return I18N.t(key); }
