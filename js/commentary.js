// ==================== COMMENTARY CONTROLLER ====================
// Handles Old and New Testament Commentary

const COMMENTARY = {
    // Data paths
    oldTestamentCommentaryPath: 'data/commentary/old-testament-commentary.json',
    newTestamentCommentaryPath: 'data/commentary/new-testament-commentary.json',

    // Cache
    cache: {
        oldTestamentCommentary: null,
        newTestamentCommentary: null
    },

    currentType: null,
    currentBook: null,

    // Load Old Testament Commentary
    async loadOldTestamentCommentary() {
        this.currentType = 'old';

        if (!this.cache.oldTestamentCommentary) {
            APP.showLoading(true);
            this.cache.oldTestamentCommentary = await APP.fetchJSON(this.oldTestamentCommentaryPath);
            APP.showLoading(false);
        }

        if (this.cache.oldTestamentCommentary) {
            this.displayCommentary(this.cache.oldTestamentCommentary, 'old');
        } else {
            this.showError('فشل تحميل تفسير العهد القديم');
        }
    },

    // Load New Testament Commentary
    async loadNewTestamentCommentary() {
        this.currentType = 'new';

        if (!this.cache.newTestamentCommentary) {
            APP.showLoading(true);
            this.cache.newTestamentCommentary = await APP.fetchJSON(this.newTestamentCommentaryPath);
            APP.showLoading(false);
        }

        if (this.cache.newTestamentCommentary) {
            this.displayCommentary(this.cache.newTestamentCommentary, 'new');
        } else {
            this.showError('فشل تحميل تفسير العهد الجديد');
        }
    },

    // Display commentary structure
    displayCommentary(data, type) {
        const container = type === 'old' 
            ? document.getElementById('ot-commentary-content')
            : document.getElementById('nt-commentary-content');

        if (!container) return;

        try {
            const books = this.extractBooks(data);

            if (books.length === 0) {
                container.innerHTML = '<p class="error">لا توجد تفسيرات متاحة</p>';
                return;
            }

            // Create book selector
            let html = `
                <div class="book-selector">
                    <label>اختر الكتاب:</label>
                    <select id="commentaryBookSelect_${type}" onchange="COMMENTARY.loadCommentaryBook(this.value, '${type}')">
                        <option value="">-- اختر كتاباً --</option>
            `;

            books.forEach((book, index) => {
                const bookName = this.extractBookName(book);
                html += `<option value="${index}">${bookName}</option>`;
            });

            html += `
                    </select>
                </div>
                <div id="commentaryChapterContainer_${type}"></div>
                <div id="commentaryContent_${type}"></div>
            `;

            container.innerHTML = html;

        } catch (error) {
            console.error('❌ خطأ في عرض التفسير:', error);
            this.showError('خطأ في عرض البيانات');
        }
    },

    // Load commentary book chapters
    loadCommentaryBook(bookIndex, type) {
        if (!bookIndex) return;

        const commentary = type === 'old' 
            ? this.cache.oldTestamentCommentary 
            : this.cache.newTestamentCommentary;

        if (!commentary) return;

        const books = this.extractBooks(commentary);
        const book = books[bookIndex];

        if (!book) return;

        this.currentBook = bookIndex;

        const chapters = this.extractChapters(book);
        const container = document.getElementById(`commentaryChapterContainer_${type}`);

        if (container) {
            let html = '<div class="chapter-list">';
            
            chapters.forEach((chapter, index) => {
                html += `<button class="chapter-btn" data-chapter="${index}" onclick="COMMENTARY.loadCommentaryChapter(${index}, '${type}')">${index + 1}</button>`;
            });

            html += '</div>';
            container.innerHTML = html;
        }

        document.getElementById(`commentaryContent_${type}`).innerHTML = '';
    },

    // Load commentary chapter
    loadCommentaryChapter(chapterIndex, type) {
        const commentary = type === 'old' 
            ? this.cache.oldTestamentCommentary 
            : this.cache.newTestamentCommentary;

        if (!commentary) return;

        const books = this.extractBooks(commentary);
        const book = books[this.currentBook];
        const chapters = this.extractChapters(book);
        const chapter = chapters[chapterIndex];

        if (!chapter) return;

        // Update active button
        const container = document.getElementById(`commentaryChapterContainer_${type}`);
        if (container) {
            container.querySelectorAll('.chapter-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.chapter === String(chapterIndex)) {
                    btn.classList.add('active');
                }
            });
        }

        // Display chapter commentary
        const text = this.extractCommentaryText(chapter);
        const contentContainer = document.getElementById(`commentaryContent_${type}`);

        if (contentContainer) {
            contentContainer.innerHTML = `
                <div class="chapter-text">
                    ${APP.formatText(text)}
                </div>
            `;
        }
    },

    // Extract books from commentary data
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

    // Extract commentary text
    extractCommentaryText(chapter) {
        if (typeof chapter === 'string') return chapter;
        if (chapter.text) return chapter.text;
        if (chapter.content) return chapter.content;
        if (chapter.commentary) return chapter.commentary;
        if (chapter.explanation) return chapter.explanation;
        
        // Try verses
        if (chapter.verses) {
            if (Array.isArray(chapter.verses)) {
                return chapter.verses
                    .map(v => {
                        if (typeof v === 'string') return v;
                        if (v.text) return v.text;
                        if (v.content) return v.content;
                        return '';
                    })
                    .filter(v => v)
                    .join('\n');
            }
            return chapter.verses;
        }

        // Search for text content
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
        const oldContainer = document.getElementById('ot-commentary-content');
        const newContainer = document.getElementById('nt-commentary-content');

        if (oldContainer) {
            oldContainer.innerHTML = `<div class="error-message"><p>⚠️ ${message}</p></div>`;
        }
        if (newContainer) {
            newContainer.innerHTML = `<div class="error-message"><p>⚠️ ${message}</p></div>`;
        }
    }
};
