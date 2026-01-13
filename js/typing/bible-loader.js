/**
 * BACKCHAIN - Bible Data Loader
 */

window.BibleData = {
    data: null,
    currentBook: 'the entire Bible',
    
    allVersesGlobal: [],
    
    library: {
        // 'Special' category REMOVED. handled manually in UI.
        'Books of the Law': ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'],
        'Historical Books': ['Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther'],
        'Poetic Books': ['Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon'],
        'Major Prophets': ['Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel'],
        'Minor Prophets': ['Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'],
        'Gospels and History': ['Matthew', 'Mark', 'Luke', 'John', 'Acts'],
        'The Letters': ['Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude'],
        'Book of Vision': ['Revelation']
    },

    init: function() {
        if (window.BibleDataFull) {
            this.data = window.BibleDataFull;
            this.buildGlobalIndex();
            console.log('✅ Bible data loaded. Total verses: ' + this.allVersesGlobal.length);
        } else {
            console.error('❌ BibleDataFull not found.');
            this.data = [];
        }
    },

    buildGlobalIndex: function() {
        this.allVersesGlobal = [];
        var globalIndex = 0;

        for (var b = 0; b < this.data.length; b++) {
            var book = this.data[b];
            for (var c = 0; c < book.chapters.length; c++) {
                var verses = book.chapters[c];
                for (var v = 0; v < verses.length; v++) {
                    this.allVersesGlobal.push({
                        text: this.cleanText(verses[v]),
                        reference: book.name + ' ' + (c + 1) + ':' + (v + 1),
                        bookName: book.name,
                        chapter: c + 1,
                        verse: v + 1,
                        globalIndex: globalIndex++
                    });
                }
            }
        }
    },

    setBook: function(bookName) {
        this.currentBook = bookName;
        console.log('Book set to:', this.currentBook);
    },

    cleanText: function(text) {
        if (!text) return "";
        var t = text.replace(/\{[^}]*:[^}]*\}/g, '');
        t = t.replace(/[{}]/g, '');
        t = t.replace(/<[^>]*>/g, '').replace(/\[.*?\]/g, '');
        return t.replace(/\s+/g, ' ').trim();
    },

    getVersesForRun: function(runNumber) {
        var sourceArray = [];

        if (this.currentBook === 'the entire Bible') {
            sourceArray = this.allVersesGlobal;
        } else {
            sourceArray = this.allVersesGlobal.filter(function(v) { 
                return v.bookName === this.currentBook || 
                       (this.currentBook === 'Song of Solomon' && v.bookName === 'Song of Songs'); 
            }.bind(this));
        }

        if (sourceArray.length === 0) return [];

        var count = Math.min(runNumber, sourceArray.length);
        var startIndex = sourceArray.length - count;
        
        return sourceArray.slice(startIndex, startIndex + count);
    },

    getRandomVerse: function() {
        var sourceArray;
        if (this.currentBook === 'the entire Bible') {
            sourceArray = this.allVersesGlobal;
        } else {
            sourceArray = this.allVersesGlobal.filter(function(v) { 
                return v.bookName === this.currentBook; 
            }.bind(this));
        }
        
        if (sourceArray.length === 0) return { reference: "Loading...", text: "" };
        return sourceArray[Math.floor(Math.random() * sourceArray.length)];
    },

    getContext: function(verseObj) {
        if (!verseObj || verseObj.globalIndex === undefined) return { prev: [], next: [] };

        var idx = verseObj.globalIndex;
        var prev = [];
        var next = [];
        var maxOffset = 2;

        for (var i = 1; i <= maxOffset; i++) {
            if (idx - i >= 0) {
                var v = this.allVersesGlobal[idx - i];
                if (v.chapter === verseObj.chapter && v.bookName === verseObj.bookName) {
                    prev.unshift(v);
                }
            }
        }

        for (var i = 1; i <= maxOffset; i++) {
            if (idx + i < this.allVersesGlobal.length) {
                var v = this.allVersesGlobal[idx + i];
                if (v.chapter === verseObj.chapter && v.bookName === verseObj.bookName) {
                    next.push(v);
                }
            }
        }
        
        var resultPrev = [];
        var resultNext = [];

        if (prev.length === 0 && next.length >= 2) {
            resultNext = next.slice(0, 2);
        } else if (next.length === 0 && prev.length >= 2) {
            resultPrev = prev.slice(prev.length - 2);
        } else {
            if (prev.length > 0) resultPrev.push(prev[prev.length - 1]);
            if (next.length > 0) resultNext.push(next[0]);
        }

        return { prev: resultPrev, next: resultNext };
    },

    getVerseCount: function() {
        if (this.currentBook === 'the entire Bible') return this.allVersesGlobal.length;
        var book = this.data.find(function(b) { return b.name === this.currentBook; }.bind(this));
        if (!book) return 0;
        var count = 0;
        book.chapters.forEach(function(c) { count += c.length; });
        return count;
    }
};