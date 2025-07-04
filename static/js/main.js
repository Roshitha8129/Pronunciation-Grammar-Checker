// ===== MAIN JAVASCRIPT FOR PRONUNCIATION DETECTOR =====

// Global Variables
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let recognition = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Main initialization function
function initializeApp() {
    // Initialize tooltips
    initializeTooltips();
    
    // Initialize speech recognition
    initializeSpeechRecognition();
    
    // Add smooth scrolling
    addSmoothScrolling();
    
    // Initialize animations
    initializeAnimations();
    
    // Add keyboard shortcuts
    addKeyboardShortcuts();
    
    console.log('Pronunciation Detector App Initialized');
}

// Initialize Bootstrap tooltips
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Initialize Speech Recognition
function initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onstart = function() {
            console.log('Speech recognition started');
        };
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            console.log('Speech recognized:', transcript);
            handleSpeechResult(transcript);
        };
        
        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            showNotification('Speech recognition error: ' + event.error, 'error');
        };
        
        recognition.onend = function() {
            console.log('Speech recognition ended');
        };
    } else {
        console.warn('Speech recognition not supported in this browser');
    }
}

// Handle speech recognition results
function handleSpeechResult(transcript) {
    const command = transcript.toLowerCase();
    
    // Voice navigation commands
    if (command.includes('home') || command.includes('dashboard')) {
        window.location.href = '/home';
    } else if (command.includes('grammar') || command.includes('check')) {
        window.location.href = '/grammar';
    } else if (command.includes('practice') || command.includes('pronunciation')) {
        window.location.href = '/practice';
    } else if (command.includes('profile') || command.includes('settings')) {
        window.location.href = '/profile';
    } else if (command.includes('logout') || command.includes('sign out')) {
        window.location.href = '/logout';
    } else {
        showNotification('Command not recognized. Try: "home", "grammar", "practice", or "profile"', 'warning');
    }
}

// Add smooth scrolling to anchor links
function addSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Initialize animations
function initializeAnimations() {
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);
    
    // Observe elements with animation classes
    document.querySelectorAll('.feature-card, .stat-card, .card').forEach(el => {
        observer.observe(el);
    });
}

// Add keyboard shortcuts
function addKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'h':
                    e.preventDefault();
                    window.location.href = '/home';
                    break;
                case 'g':
                    e.preventDefault();
                    window.location.href = '/grammar';
                    break;
                case 'p':
                    e.preventDefault();
                    window.location.href = '/practice';
                    break;
                case 'u':
                    e.preventDefault();
                    window.location.href = '/profile';
                    break;
            }
        }
        
        // Escape key to close modals
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                const modal = bootstrap.Modal.getInstance(openModal);
                if (modal) modal.hide();
            }
        }
    });
}

// Utility Functions

// Show notification
function showNotification(message, type = 'info', duration = 5000) {
    const alertClass = type === 'error' ? 'danger' : type;
    const alertHtml = `
        <div class="alert alert-${alertClass} alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;" role="alert">
            <i class="fas fa-${getIconForType(type)} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', alertHtml);
    
    // Auto-remove after duration
    setTimeout(() => {
        const alert = document.querySelector('.alert:last-of-type');
        if (alert) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }
    }, duration);
}

// Get icon for notification type
function getIconForType(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-triangle',
        'warning': 'exclamation-circle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Format time (seconds to MM:SS)
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Calculate text statistics
function calculateTextStats(text) {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    
    return {
        words: words.length,
        sentences: sentences.length,
        characters: characters,
        charactersNoSpaces: charactersNoSpaces,
        avgWordsPerSentence: sentences.length > 0 ? Math.round(words.length / sentences.length) : 0
    };
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate password strength
function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const score = [
        password.length >= minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar
    ].filter(Boolean).length;
    
    return {
        isValid: score >= 4,
        score: score,
        feedback: getPasswordFeedback(score, password.length >= minLength, hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar)
    };
}

// Get password strength feedback
function getPasswordFeedback(score, hasLength, hasUpper, hasLower, hasNumbers, hasSpecial) {
    const feedback = [];
    
    if (!hasLength) feedback.push('At least 8 characters');
    if (!hasUpper) feedback.push('One uppercase letter');
    if (!hasLower) feedback.push('One lowercase letter');
    if (!hasNumbers) feedback.push('One number');
    if (!hasSpecial) feedback.push('One special character');
    
    const strength = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][score];
    
    return {
        strength: strength,
        missing: feedback
    };
}

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for performance
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Local storage helpers
const Storage = {
    set: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    },
    
    get: function(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return defaultValue;
        }
    },
    
    remove: function(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Error removing from localStorage:', e);
        }
    }
};

// Export functions for use in other files
window.PronunciationDetector = {
    showNotification,
    formatTime,
    calculateTextStats,
    isValidEmail,
    validatePassword,
    debounce,
    throttle,
    Storage
};
