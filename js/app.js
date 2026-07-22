// ==================== MAIN APP CONTROLLER ====================

const APP = {
    currentPage: 'home',
    isLoading: false,

    // Initialize the application
    init() {
        console.log('🚀 تطبيق الكنيسة - Mekha بدء التشغيل');
        this.setupEventListeners();
        this.showPage('home');
    },

    // Setup all event listeners
    setupEventListeners() {
        // Navigation menu
        document.querySelectorAll('nav a[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.showPage(page);
                this.closeMenu();
            });
        });

        // Home feature cards
        document.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('click', () => {
                const page = card.dataset.page;
                this.showPage(page);
            });
        });

        // Mobile menu toggle
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => this.toggleMenu());
        }

        // App logo click - go to home
        const logo = document.querySelector('.app-logo');
        if (logo) {
            logo.addEventListener('click', () => this.showPage('home'));
        }
    },

    // Show a specific page
    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show selected page
        const page = document.getElementById(pageId);
        if (page) {
            page.classList.add('active');
            this.currentPage = pageId;
            
            // Scroll to top
            window.scrollTo(0, 0);

            // Load page-specific content
            this.loadPageContent(pageId);
        }
    },

    // Load page-specific content
    loadPageContent(pageId) {
        switch(pageId) {
            case 'agpeya':
                AGPEYA.setupEventListeners();
                break;
            case 'bible':
                BIBLE.init();
                break;
            case 'old-testament-commentary':
                COMMENTARY.loadOldTestamentCommentary();
                break;
            case 'new-testament-commentary':
                COMMENTARY.loadNewTestamentCommentary();
                break;
        }
    },

    // Toggle mobile menu
    toggleMenu() {
        const navMenu = document.getElementById('navMenu');
        if (navMenu) {
            navMenu.classList.toggle('active');
        }
    },

    // Close mobile menu
    closeMenu() {
        const navMenu = document.getElementById('navMenu');
        if (navMenu) {
            navMenu.classList.remove('active');
        }
    },

    // Show loading indicator
    showLoading(show = true) {
        const loading = document.getElementById('loadingIndicator');
        if (loading) {
            if (show) {
                loading.classList.add('show');
            } else {
                loading.classList.remove('show');
            }
        }
        this.isLoading = show;
    },

    // Fetch JSON data with lazy loading
    async fetchJSON(filePath) {
        try {
            this.showLoading(true);
            const response = await fetch(filePath);
            
            if (!response.ok) {
                throw new Error(`خطأ في تحميل الملف: ${filePath}`);
            }
            
            const data = await response.json();
            this.showLoading(false);
            return data;
        } catch (error) {
            console.error('❌ خطأ في تحميل البيانات:', error);
            this.showLoading(false);
            return null;
        }
    },

    // Utility: Extract text from nested object
    extractText(obj) {
        if (typeof obj === 'string') return obj;
        if (typeof obj === 'object' && obj !== null) {
            // Try to find content field first
            if (obj.content) return obj.content;
            // Try other common field names
            if (obj.text) return obj.text;
            if (obj.body) return obj.body;
            if (obj.verse) return obj.verse;
            // If none found, try first string value
            for (let key in obj) {
                if (typeof obj[key] === 'string') return obj[key];
            }
        }
        return '';
    },

    // Format text for display
    formatText(text) {
        if (!text) return '';
        return text
            .replace(/\n/g, '<br>')
            .replace(/\r/g, '')
            .trim();
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    APP.init();
});

// Handle errors globally
window.addEventListener('error', (event) => {
    console.error('❌ خطأ عام:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ رفض وعد غير معالج:', event.reason);
});
