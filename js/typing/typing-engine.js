/**
 * BACKCHAIN - Typing Engine
 * Word-by-word typing system with proper accuracy tracking
 */

window.TypingEngine = {
    currentVerse: null,
    words: [],
    currentWordIndex: 0,
    currentWordTyped: '',
    
    // Proper keystroke tracking
    totalCharactersTyped: 0,
    correctCharactersTyped: 0,
    wordsCompleted: 0,
    errorCount: 0,
    startTime: 0,

    init: function(verse) {
        this.currentVerse = verse;
        this.words = verse.text.split(' ');
        this.currentWordIndex = 0;
        this.currentWordTyped = '';
        this.totalCharactersTyped = 0;
        this.correctCharactersTyped = 0;
        this.wordsCompleted = 0;
        this.errorCount = 0;
        this.startTime = performance.now();
    },

    getCurrentWord: function() {
        if (this.currentWordIndex < this.words.length) {
            return this.words[this.currentWordIndex];
        }
        return '';
    },

    isLastWord: function() {
        return this.currentWordIndex === this.words.length - 1;
    },

    isWordComplete: function() {
        return this.currentWordTyped === this.getCurrentWord();
    },

    isCurrentInputCorrect: function() {
        var currentWord = this.getCurrentWord();
        var expectedSoFar = currentWord.substring(0, this.currentWordTyped.length);
        return this.currentWordTyped === expectedSoFar;
    },

    advanceWord: function() {
        var word = this.getCurrentWord();
        this.wordsCompleted++;
        this.correctCharactersTyped += word.length;
        this.totalCharactersTyped += word.length;
        this.currentWordIndex++;
        this.currentWordTyped = '';
        return this.currentWordIndex >= this.words.length;
    },

    setTypedText: function(text) {
        var oldLength = this.currentWordTyped.length;
        var newLength = text.length;
        
        // Track new characters typed (not backspaces)
        if (newLength > oldLength) {
            var newChars = newLength - oldLength;
            this.totalCharactersTyped += newChars;
            
            // Check if the new character(s) are correct
            var currentWord = this.getCurrentWord();
            var expectedSoFar = currentWord.substring(0, newLength);
            if (text === expectedSoFar) {
                this.correctCharactersTyped += newChars;
            } else {
                this.errorCount += newChars;
            }
        }
        
        this.currentWordTyped = text;
        
        // Auto-complete last word
        if (this.isLastWord() && this.isWordComplete()) {
            return { autoComplete: true };
        }
        return { autoComplete: false };
    },

    getAccuracy: function() {
        if (this.totalCharactersTyped === 0) return 100;
        var accuracy = (this.correctCharactersTyped / this.totalCharactersTyped) * 100;
        return Math.min(100, Math.max(0, Math.round(accuracy)));
    },

    getWPM: function() {
        var elapsedMinutes = (performance.now() - this.startTime) / 60000;
        if (elapsedMinutes < 0.01) return 0;
        // Standard: 5 characters = 1 word
        var totalChars = this.correctCharactersTyped;
        var words = totalChars / 5;
        return Math.round(words / elapsedMinutes);
    },

    getElapsedTime: function() {
        return (performance.now() - this.startTime) / 1000;
    },

    getDisplayData: function() {
        return {
            reference: this.currentVerse ? this.currentVerse.reference : '',
            words: this.words,
            currentWordIndex: this.currentWordIndex,
            currentWord: this.getCurrentWord(),
            currentWordTyped: this.currentWordTyped,
            accuracy: this.getAccuracy(),
            wpm: this.getWPM(),
            progress: this.words.length > 0 ? (this.currentWordIndex / this.words.length) : 0
        };
    },

    isComplete: function() {
        return this.currentWordIndex >= this.words.length;
    }
};

console.log('TypingEngine module loaded');