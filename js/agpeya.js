// ==================== AGPEYA CONTROLLER ====================
// Handles the 8 daily prayers

const AGPEYA = {
    prayerFiles: {
        1: 'data/agpeya/prayer-1.json',
        2: 'data/agpeya/prayer-2.json',
        3: 'data/agpeya/prayer-3.json',
        4: 'data/agpeya/prayer-4.json',
        5: 'data/agpeya/prayer-5.json',
        6: 'data/agpeya/prayer-6.json',
        7: 'data/agpeya/prayer-7.json',
        8: 'data/agpeya/prayer-8.json'
    },

    prayerNames: {
        1: 'صلاة الساعة الأولى (الفجر - Prime)',
        2: 'صلاة الساعة الثالثة',
        3: 'صلاة الساعة السادسة (الظهيرة)',
        4: 'صلاة الساعة التاسعة',
        5: 'صلاة الغروب (Vespers)',
        6: 'صلاة النوم (Compline)',
        7: 'صلاة منتصف الليل (Midnight)',
        8: 'صلاة الحجاب (Veil)'
    },

    currentPrayer: null,
    cache: {}, // Cache loaded prayers

    // Setup event listeners for prayer buttons
    setupEventListeners() {
        document.querySelectorAll('.prayer-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const prayerNum = btn.dataset.prayer;
                this.loadPrayer(prayerNum);
            });
        });
    },

    // Load a specific prayer
    async loadPrayer(prayerNum) {
        try {
            // Check cache first
            if (this.cache[prayerNum]) {
                this.displayPrayer(prayerNum, this.cache[prayerNum]);
                return;
            }

            const filePath = this.prayerFiles[prayerNum];
            if (!filePath) {
                console.error('❌ رقم الصلاة غير صحيح:', prayerNum);
                return;
            }

            APP.showLoading(true);
            const data = await APP.fetchJSON(filePath);
            APP.showLoading(false);

            if (data) {
                // Cache the data
                this.cache[prayerNum] = data;
                this.displayPrayer(prayerNum, data);
            }
        } catch (error) {
            console.error('❌ خطأ في تحميل الصلاة:', error);
            APP.showLoading(false);
            this.showError('فشل تحميل الصلاة. يرجى المحاولة لاحقاً.');
        }
    },

    // Display prayer content
    displayPrayer(prayerNum, data) {
        const container = document.getElementById('prayer-content');
        
        if (!container || !data) {
            this.showError('لا يمكن عرض الصلاة');
            return;
        }

        try {
            let content = '';

            // Build prayer text from JSON structure
            if (data.content) {
                content = this.extractPrayerText(data.content);
            } else if (data.text) {
                content = data.text;
            } else if (typeof data === 'string') {
                content = data;
            } else {
                // Try to find the first text content
                content = this.findTextContent(data);
            }

            // Format and display
            container.innerHTML = `
                <div class="prayer-display">
                    <h2>${this.prayerNames[prayerNum]}</h2>
                    <div class="prayer-text">
                        ${APP.formatText(content)}
                    </div>
                </div>
            `;

            // Update active button styling
            this.updateActiveButton(prayerNum);

        } catch (error) {
            console.error('❌ خطأ في عرض الصلاة:', error);
            this.showError('خطأ في عرض الصلاة');
        }
    },

    // Extract prayer text from nested JSON structure
    extractPrayerText(obj) {
        let text = '';

        if (typeof obj === 'string') {
            return obj;
        }

        if (Array.isArray(obj)) {
            text = obj.map(item => this.extractPrayerText(item)).join('\n');
        } else if (typeof obj === 'object' && obj !== null) {
            // Process object fields in order
            for (let key in obj) {
                const value = obj[key];
                
                // Skip structural keys
                if (['title', 'name', 'chapter', 'verse', 'id', 'number'].includes(key.toLowerCase())) {
                    continue;
                }

                if (typeof value === 'string' && value.trim()) {
                    text += value + '\n';
                } else if (typeof value === 'object') {
                    text += this.extractPrayerText(value) + '\n';
                }
            }
        }

        return text.trim();
    },

    // Find text content recursively
    findTextContent(obj, depth = 0) {
        if (depth > 5) return ''; // Prevent infinite recursion

        if (typeof obj === 'string') {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj
                .filter(item => typeof item === 'string' && item.trim())
                .join('\n');
        }

        if (typeof obj === 'object' && obj !== null) {
            // Look for content first
            if (obj.content) return this.findTextContent(obj.content, depth + 1);
            if (obj.text) return this.findTextContent(obj.text, depth + 1);
            if (obj.body) return this.findTextContent(obj.body, depth + 1);

            // Then look in nested objects
            for (let key in obj) {
                const result = this.findTextContent(obj[key], depth + 1);
                if (result) return result;
            }
        }

        return '';
    },

    // Update active button styling
    updateActiveButton(prayerNum) {
        document.querySelectorAll('.prayer-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.prayer === String(prayerNum)) {
                btn.classList.add('active');
            }
        });
    },

    // Show error message
    showError(message) {
        const container = document.getElementById('prayer-content');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <p>⚠️ ${message}</p>
                    <p>يرجى التأكد من وجود ملفات البيانات في المجلد الصحيح.</p>
                </div>
            `;
        }
    }
};

// Add CSS for prayer display
const style = document.createElement('style');
style.textContent = `
    .prayer-display {
        animation: slideIn 0.3s ease;
    }

    .prayer-display h2 {
        color: #667eea;
        margin-bottom: 1.5rem;
        text-align: center;
        font-size: 1.3rem;
        border-bottom: 2px solid #667eea;
        padding-bottom: 1rem;
    }

    .prayer-text {
        text-align: right;
        line-height: 2;
        word-spacing: 0.1em;
        white-space: pre-wrap;
        word-wrap: break-word;
    }

    .error-message {
        background-color: #fff3cd;
        border: 1px solid #ffc107;
        border-radius: 5px;
        padding: 1.5rem;
        text-align: center;
        color: #856404;
    }

    .error-message p {
        margin: 0.5rem 0;
    }

    .prayer-btn.active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);
