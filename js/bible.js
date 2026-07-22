// ==================== BIBLE CONTROLLER ====================
// Handles Holy Bible navigation and display

const BIBLE = {
    // Data paths
    oldTestamentPath: 'data/bible/old-testament.json',
    newTestamentPath: 'data/bible/new-testament.json',

    // Cache for performance
    cache: {
        oldTestament: null,
        newTestament: null
    },

    currentTestament: null,
    currentBook: null,
    currentChapter: null,

    // Initialize Bible functionality
    init() {
        this.setupEventListeners();
        this.renderInitialContent();
    },

    // Setup event listeners
    setupEventListeners() {
        const oldBtn = document.getElementById('oldTestamentBtn');
        const newBtn = document.getElementById('newTestamentBtn');

        if (oldBtn) {
            oldBtn.addEventListener('click', () => this.showOldTestament());
        }
        if (newBtn) {
            newBtn.addEventListener('click', () => this.showNewTestament());
        }
    },

    // Render initial content
    renderInitialContent() {
        const content = document.getElementById('bible-content');
        if (content) {
            content.innerHTML = `
                <div class="bible-welcome">
                    <p>اختر من الأعلى لبدء قراءة الكتاب المقدس</p>
                </div>
            `;
        }
    },

    // Show Old Testament
    async showOldTestament() {
        this.currentTestament = 'old';
        
        if (!this.cache.oldTestament) {
            APP.showLoading(true);
            this.cache.oldTestament = await APP.fetchJSON(this.oldTestamentPath);
            APP.showLoading(false);
        }

        if (this.cache.oldTestament) {
            this.displayTestament(this.cache.oldTestament, 'old');
        } else {
            this.showError('فشل تحميل العهد القديم');
        }
    },

    // Show New Testament
    async showNewTestament() {
        this.currentTestament = 'new';
        
        if (!this.cache.newTestament) {
            APP.showLoading(true);
            this.cache.newTestament = await APP.fetchJSON(this.newTestamentPath);
            APP.showLoading(false);
        }

        if (this.cache.newTestament) {
            this.displayTestament(this.cache.newTestament, 'new');
        } else {
            this.showError('فشل تحميل العهد الجديد');
        }
    },

    // Display testament structure
    displayTestament(data, type) {
        const content = document.getElementById('bible-content');
        if (!content) return;

        try {
            const books = this.extractBooks(data);

            if (books.length === 0) {
                content.innerHTML = '<p class="error">لا توجد كتب متاحة</p>';
                return;
            }

            // Create book selector
            let html = `
                <div class="book-selector">
                    <label>اختر الكتاب:</label>
                    <select id="bookSelect" onchange="BIBLE.loadBook(this.value)">
                        <option value="">-- اختر كتاباً --</option>
            `;

            books.forEach((book, index) => {
                const bookName = this.extractBookName(book);
                html += `<option value="${index}">${bookName}</option>`;
            });

            html += `
                    </select>
                </div>
                <div id="chapterContainer"></div>
                <div id="chapterContent"></div>
            `;

            content.innerHTML = html;

        } catch (error) {
            console.error('❌ خطأ في عرض العهد:', error);
            this.showError('خطأ في عرض البيانات');
        }
    },

    // Load book chapters
    loadBook(bookIndex) {
        if (!bookIndex) return;

        const testament = this.currentTestament === 'old' 
            ? this.cache.oldTestament 
            : this.cache.newTestament;

        if (!testament) return;

        const books = this.extractBooks(testament);
        const book = books[bookIndex];

        if (!book) return;

        this.currentBook = bookIndex;
        this.currentChapter = null;

        const chapters = this.extractChapters(book);
        const container = document.getElementById('chapterContainer');

        if (container) {
            let html = '<div class="chapter-list">';
            
            chapters.forEach((chapter, index) => {
                html += `<button class="chapter-btn" data-chapter="${index}" onclick="BIBLE.loadChapter(${index})">${index + 1}</button>`;
            });

            html += '</div>';
            container.innerHTML = html;
        }

        document.getElementById('chapterContent').innerHTML = '';
    },

    // Load chapter content
    loadChapter(chapterIndex) {
        const testament = this.currentTestament === 'old' 
            ? this.cache.oldTestament 
            : this.cache.newTestament;

        if (!testament) return;

        const books = this.extractBooks(testament);
        const book = books[this.currentBook];
        const chapters = this.extractChapters(book);
        const chapter = chapters[chapterIndex];

        if (!chapter) return;

        this.currentChapter = chapterIndex;

        // Update active button
        document.querySelectorAll('.chapter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.chapter === String(chapterIndex)) {
                btn.classList.add('active');
            }
        });

        // Display chapter content
        const text = this.extractChapterText(chapter);
        const container = document.getElementById('chapterContent');

        if (container) {
            container.innerHTML = `
                <div class="chapter-text">
                    ${APP.formatText(text)}
                </div>
            `;
        }
    },

    // Extract books from testament data
    extractBooks(data) {
        if (Array.isArray(data)) return data;
        if (data.books) return data.books;
        if (data.content) {
            if (Array.isArray(data.content)) return data.content;
            if (data.content.books) return data.content.books;
        }
        return [];
    },

    // Extract book name
    extractBookName(book) {
        if (typeof book === 'string') return book;
        if (book.name) return book.name;
        if (book.title) return book.title;
        if (book.book) return book.book;
        return 'كتاب بدون اسم';
    },

    // Extract chapters from book
    extractChapters(book) {
        if (!book) return [];
        if (Array.isArray(book)) return book;
        if (book.chapters) return book.chapters;
        if (book.content) {
            if (Array.isArray(book.content)) return book.content;
            if (book.content.chapters) return book.content.chapters;
        }
        return [];
    },

    // Extract chapter text
    extractChapterText(chapter) {
        if (typeof chapter === 'string') return chapter;
        if (chapter.text) return chapter.text;
        if (chapter.content) return chapter.content;
        if (chapter.verses) {
            if (Array.isArray(chapter.verses)) {
                return chapter.verses
                    .map(v => typeof v === 'string' ? v : (v.text || v.content || ''))
                    .join('\n');
            }
            return chapter.verses;
        }

        // Try to find text content recursively
        let text = '';
        for (let key in chapter) {
            const value = chapter[key];
            if (typeof value === 'string' && value.length > 50) {
                text += value + '\n';
            }
        }
        return text;
    },

    // Show error message
    showError(message) {
        const container = document.getElementById('bible-content');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <p>⚠️ ${message}</p>
                </div>
            `;
        }
    }
};

// Add CSS for Bible
const bibleStyle = document.createElement('style');
bibleStyle.textContent = `
    .bible-welcome {
        text-align: center;
        padding: 3rem 1rem;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
        border-radius: 10px;
        color: #667eea;
        font-size: 1.1rem;
    }

    .chapter-text {
        line-height: 2.5;
        word-spacing: 0.1em;
        text-align: right;
    }

    .chapter-text p {
        margin-bottom: 1rem;
    }
`;
document.head.appendChild(bibleStyle);
