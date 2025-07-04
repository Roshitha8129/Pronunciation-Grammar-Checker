// ===== GRAMMAR CHECKER JAVASCRIPT =====

// DOM Elements
let inputText, resultsContainer, checkBtn, clearBtn, sampleBtn;
let charCount, wordCount, sentenceCount, errorCount, scorePercent;

// Sample texts for practice
const sampleTexts = [
    "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet.",
    "She don't like to go to school everyday. Their are many reasons why students struggle with grammar.",
    "I have went to the store yesterday. The weather was very nice and sunny outside.",
    "Your going to love this new restaurant. Its the best place in town for italian food.",
    "The team are playing very good this season. They has won most of there games so far."
];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeGrammarChecker();
});

// Initialize grammar checker
function initializeGrammarChecker() {
    // Get DOM elements
    inputText = document.getElementById('inputText');
    resultsContainer = document.getElementById('resultsContainer');
    checkBtn = document.getElementById('checkBtn');
    clearBtn = document.getElementById('clearBtn');
    sampleBtn = document.getElementById('sampleBtn');
    
    // Statistics elements
    charCount = document.getElementById('charCount');
    wordCount = document.getElementById('wordCount');
    sentenceCount = document.getElementById('sentenceCount');
    errorCount = document.getElementById('errorCount');
    scorePercent = document.getElementById('scorePercent');
    
    // Add event listeners
    addEventListeners();
    
    // Initialize character counter
    updateCharacterCount();
    
    console.log('Grammar checker initialized');
}

// Add event listeners
function addEventListeners() {
    // Form submission
    document.getElementById('grammarForm').addEventListener('submit', handleGrammarCheck);
    
    // Input text changes
    inputText.addEventListener('input', debounce(function() {
        updateCharacterCount();
        updateTextStatistics();
    }, 300));
    
    // Clear button
    clearBtn.addEventListener('click', clearText);
    
    // Sample button
    sampleBtn.addEventListener('click', loadSampleText);
    
    // Keyboard shortcuts
    inputText.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleGrammarCheck(e);
            }
        }
    });
}

// Handle grammar check form submission
async function handleGrammarCheck(e) {
    e.preventDefault();
    
    const text = inputText.value.trim();
    
    if (!text) {
        showNotification('Please enter some text to check', 'warning');
        inputText.focus();
        return;
    }
    
    if (text.length > 5000) {
        showNotification('Text is too long. Maximum 5000 characters allowed.', 'error');
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    
    try {
        // Send request to backend
        const response = await fetch('/api/check-grammar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        displayResults(result);
        updateStatistics(result);
        
    } catch (error) {
        console.error('Grammar check error:', error);
        showNotification('Error checking grammar. Please try again.', 'error');
        displayOfflineResults(text);
    } finally {
        setLoadingState(false);
    }
}

// Display grammar check results with error handling
function displayResults(result) {
    console.log('Displaying results:', result);

    // Update statistics
    updateStatistics(result);

    // Try enhanced display with error handling
    try {
        if (result.highlighted_text || result.corrections_applied) {
            displayEnhancedResults(result);
            return;
        }
    } catch (error) {
        console.error('Enhanced display failed:', error);
    }

    // Fallback to simple display
    displaySimpleResults(result);
}

// Simple results display that always works
function displaySimpleResults(result) {
    if (!resultsContainer) return;

    if (!result.errors || result.errors.length === 0) {
        resultsContainer.innerHTML = `
            <div class="text-center text-success py-4">
                <i class="fas fa-check-circle fa-3x mb-3"></i>
                <h5>Excellent! No errors found.</h5>
                <p class="text-muted mb-0">Your text appears to be grammatically correct.</p>
            </div>
        `;
        return;
    }

    // Build simple results HTML
    let resultsHtml = `
        <div class="alert alert-warning">
            <h6><i class="fas fa-exclamation-triangle me-2"></i>${result.error_count || result.errors.length} Error${(result.error_count || result.errors.length) > 1 ? 's' : ''} Found</h6>
        </div>
    `;

    // Show highlighted text if available
    if (result.highlighted_text) {
        resultsHtml += `
            <div class="card mb-3">
                <div class="card-header bg-warning text-dark">
                    <h6 class="mb-0">Text with Highlighted Errors</h6>
                </div>
                <div class="card-body">
                    ${result.highlighted_text}
                </div>
            </div>
        `;
    }

    // Show corrected text if available
    if (result.corrected_text && result.corrected_text !== result.original_text) {
        resultsHtml += `
            <div class="card mb-3">
                <div class="card-header bg-success text-white">
                    <h6 class="mb-0">Corrected Text</h6>
                </div>
                <div class="card-body">
                    <p class="mb-2">${result.corrected_text}</p>
                    <button class="btn btn-sm btn-success" onclick="copyToClipboard('${result.corrected_text.replace(/'/g, "\\'")}')">
                        <i class="fas fa-copy me-1"></i>Copy Corrected Text
                    </button>
                </div>
            </div>
        `;
    }

    // Show error details
    if (result.errors && result.errors.length > 0) {
        resultsHtml += '<div class="card"><div class="card-header bg-danger text-white"><h6 class="mb-0">Error Details</h6></div><div class="card-body">';
        result.errors.forEach((error) => {
            resultsHtml += `
                <div class="mb-2 p-2 border-start border-danger border-3">
                    <strong>${error.message}</strong>
                    ${error.suggestions && error.suggestions.length > 0 ?
                        `<div class="mt-1"><small class="text-muted">Suggestions: ${error.suggestions.join(', ')}</small></div>` : ''
                    }
                </div>
            `;
        });
        resultsHtml += '</div></div>';
    }

    resultsContainer.innerHTML = resultsHtml;
}

// Display offline results (basic check)
function displayOfflineResults(text) {
    const basicErrors = performBasicGrammarCheck(text);
    
    if (basicErrors.length === 0) {
        resultsContainer.innerHTML = `
            <div class="text-center text-info py-4">
                <i class="fas fa-wifi-slash fa-2x mb-3"></i>
                <h5>Offline Mode</h5>
                <p class="mb-0">Basic check complete. Connect to internet for advanced analysis.</p>
            </div>
        `;
        return;
    }
    
    let resultsHtml = `
        <div class="mb-3">
            <div class="alert alert-info">
                <i class="fas fa-wifi-slash me-2"></i>
                <strong>Offline Mode:</strong> Basic grammar check only. Connect to internet for full analysis.
            </div>
            <h6 class="text-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Found ${basicErrors.length} potential issue${basicErrors.length > 1 ? 's' : ''}
            </h6>
        </div>
        <div class="errors-list">
    `;
    
    basicErrors.forEach(error => {
        resultsHtml += `
            <div class="error-item mb-3 p-3 border rounded">
                <div class="d-flex align-items-start">
                    <div class="error-icon me-3">
                        <i class="fas fa-exclamation-circle text-warning"></i>
                    </div>
                    <div class="error-content">
                        <h6 class="mb-1 text-warning">Potential Issue</h6>
                        <p class="mb-1">${error.message}</p>
                        <small class="text-muted">Context: "${error.context}"</small>
                    </div>
                </div>
            </div>
        `;
    });
    
    resultsHtml += '</div>';
    resultsContainer.innerHTML = resultsHtml;
}

// Perform basic grammar check (offline)
function performBasicGrammarCheck(text) {
    const errors = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Common grammar mistakes patterns
    const patterns = [
        {
            regex: /\b(there|their|they're)\b/gi,
            message: "Check usage of 'there', 'their', or 'they're'",
            type: "word_choice"
        },
        {
            regex: /\b(your|you're)\b/gi,
            message: "Check usage of 'your' or 'you're'",
            type: "word_choice"
        },
        {
            regex: /\b(its|it's)\b/gi,
            message: "Check usage of 'its' or 'it's'",
            type: "word_choice"
        },
        {
            regex: /\b\w+\s+\1\b/gi,
            message: "Possible repeated word",
            type: "repetition"
        }
    ];
    
    sentences.forEach(sentence => {
        patterns.forEach(pattern => {
            const matches = sentence.match(pattern.regex);
            if (matches) {
                errors.push({
                    message: pattern.message,
                    context: sentence.trim(),
                    type: pattern.type
                });
            }
        });
    });
    
    return errors;
}

// Get error type information
function getErrorType(ruleId) {
    const errorTypes = {
        'MORFOLOGIK_RULE_EN_US': { name: 'Spelling', category: 'Spelling', color: 'danger' },
        'GRAMMAR': { name: 'Grammar', category: 'Grammar', color: 'warning' },
        'STYLE': { name: 'Style', category: 'Style', color: 'info' },
        'PUNCTUATION': { name: 'Punctuation', category: 'Punctuation', color: 'secondary' },
        'default': { name: 'Language', category: 'General', color: 'primary' }
    };
    
    return errorTypes[ruleId] || errorTypes['default'];
}

// Get error icon
function getErrorIcon(errorType) {
    const icons = {
        'Spelling': 'spell-check',
        'Grammar': 'language',
        'Style': 'pen-fancy',
        'Punctuation': 'quote-right',
        'default': 'exclamation-circle'
    };
    
    return icons[errorType.name] || icons['default'];
}

// Apply suggestion
function applySuggestion(suggestion, errorIndex) {
    // This would typically replace the error in the text
    // For now, just show a notification
    showNotification(`Applied suggestion: "${suggestion}"`, 'success');
}

// Copy text to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showNotification('Text copied to clipboard!', 'success');
    } catch (err) {
        console.error('Failed to copy text:', err);
        showNotification('Failed to copy text', 'error');
    }
}

// Update character count
function updateCharacterCount() {
    const text = inputText.value;
    const count = text.length;
    charCount.textContent = `${count} / 5000`;
    
    if (count > 4500) {
        charCount.classList.add('text-warning');
    } else if (count > 4800) {
        charCount.classList.remove('text-warning');
        charCount.classList.add('text-danger');
    } else {
        charCount.classList.remove('text-warning', 'text-danger');
    }
}

// Update text statistics
function updateTextStatistics() {
    const text = inputText.value.trim();
    const stats = calculateTextStats(text);
    
    if (wordCount) wordCount.textContent = stats.words;
    if (sentenceCount) sentenceCount.textContent = stats.sentences;
}

// Update statistics after grammar check
function updateStatistics(result) {
    const text = inputText.value.trim();
    const stats = calculateTextStats(text);
    const errors = result.errors ? result.errors.length : 0;
    const accuracy = stats.words > 0 ? Math.max(0, Math.round((1 - errors / stats.words) * 100)) : 100;
    
    if (wordCount) wordCount.textContent = stats.words;
    if (sentenceCount) sentenceCount.textContent = stats.sentences;
    if (errorCount) errorCount.textContent = errors;
    if (scorePercent) scorePercent.textContent = `${accuracy}%`;
}

// Clear text
function clearText() {
    inputText.value = '';
    resultsContainer.innerHTML = `
        <div class="text-center text-muted py-5">
            <i class="fas fa-clipboard-check fa-3x mb-3 opacity-50"></i>
            <p class="mb-0">Enter text and click "Check Grammar" to see results</p>
        </div>
    `;
    updateCharacterCount();
    updateTextStatistics();
    inputText.focus();
}

// Load sample text
function loadSampleText() {
    const randomSample = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    inputText.value = randomSample;
    updateCharacterCount();
    updateTextStatistics();
    showNotification('Sample text loaded!', 'info');
}

// Set loading state
function setLoadingState(loading) {
    if (loading) {
        checkBtn.disabled = true;
        checkBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Checking...';
    } else {
        checkBtn.disabled = false;
        checkBtn.innerHTML = '<i class="fas fa-search me-2"></i>Check Grammar';
    }
}

// Utility functions from main.js
function showNotification(message, type) {
    if (window.PronunciationDetector) {
        window.PronunciationDetector.showNotification(message, type);
    }
}

function calculateTextStats(text) {
    if (window.PronunciationDetector) {
        return window.PronunciationDetector.calculateTextStats(text);
    }
    // Fallback implementation
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    return { words: words.length, sentences: sentences.length };
}

function debounce(func, wait) {
    if (window.PronunciationDetector) {
        return window.PronunciationDetector.debounce(func, wait);
    }
    // Fallback implementation
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

// ===== ENHANCED GRAMMAR CHECKER FUNCTIONS =====

// Enhanced display results function
function displayEnhancedResults(result) {
    console.log('Displaying enhanced results:', result);

    // Update statistics
    updateStatistics(result);

    // Hide initial message
    const initialMessage = document.getElementById('initialMessage');
    if (initialMessage) {
        initialMessage.style.display = 'none';
    }

    if (result.error_count === 0) {
        displayNoErrors();
    } else {
        displayErrorsWithHighlighting(result);
    }
}

function displayNoErrors() {
    // Hide error sections safely
    const highlightedSection = document.getElementById('highlightedTextSection');
    const correctedSection = document.getElementById('correctedTextSection');
    const errorSection = document.getElementById('errorDetailsSection');

    if (highlightedSection) highlightedSection.style.display = 'none';
    if (correctedSection) correctedSection.style.display = 'none';
    if (errorSection) errorSection.style.display = 'none';

    // Show success message in main container
    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <div class="text-center text-success py-5">
                <i class="fas fa-check-circle fa-4x mb-3"></i>
                <h4 class="text-success">Perfect! No errors found.</h4>
                <p class="text-muted mb-0">Your text appears to be grammatically correct and well-written.</p>
                <div class="mt-3">
                    <span class="badge bg-success fs-6">100% Accuracy</span>
                </div>
            </div>
        `;
    }
}

function displayErrorsWithHighlighting(result) {
    // Clear main results container safely
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
    }

    // Display highlighted text
    if (result.highlighted_text) {
        const highlightedSection = document.getElementById('highlightedTextSection');
        const highlightedContainer = document.getElementById('highlightedText');

        if (highlightedContainer && highlightedSection) {
            // Add error legend
            const legendHtml = `
                <div class="error-legend mb-3">
                    <div class="error-legend-item">
                        <div class="error-legend-color spelling"></div>
                        <span>Spelling</span>
                    </div>
                    <div class="error-legend-item">
                        <div class="error-legend-color grammar"></div>
                        <span>Grammar</span>
                    </div>
                    <div class="error-legend-item">
                        <div class="error-legend-color punctuation"></div>
                        <span>Punctuation</span>
                    </div>
                    <div class="error-legend-item">
                        <div class="error-legend-color style"></div>
                        <span>Style</span>
                    </div>
                    <div class="error-legend-item">
                        <div class="error-legend-color capitalization"></div>
                        <span>Capitalization</span>
                    </div>
                </div>
            `;

            highlightedContainer.innerHTML = legendHtml + result.highlighted_text;
            highlightedSection.style.display = 'block';
        }

        // Initialize tooltips safely
        if (highlightedContainer) {
            setTimeout(() => {
                const tooltipElements = highlightedContainer.querySelectorAll('[title]');
                tooltipElements.forEach(element => {
                    new bootstrap.Tooltip(element);
                });
            }, 100);
        }
    }

    // Display corrected text
    if (result.corrected_text && result.corrected_text !== result.original_text) {
        const correctedSection = document.getElementById('correctedTextSection');
        const correctedContainer = document.getElementById('correctedText');

        if (correctedContainer && correctedSection) {
            correctedContainer.innerHTML = result.corrected_text;
            correctedSection.style.display = 'block';

            // Add copy button functionality
            addEnhancedCopyListeners(result);
        }
    }

    // Display error details
    if (result.errors && result.errors.length > 0) {
        displayEnhancedErrorDetails(result.errors);
    }
}

function displayEnhancedErrorDetails(errors) {
    const errorSection = document.getElementById('errorDetailsSection');
    const errorContainer = document.getElementById('errorDetails');

    if (!errorContainer || !errorSection) {
        return; // Exit if elements don't exist
    }

    let errorsHtml = '';

    errors.forEach((error) => {
        const errorType = error.error_type || 'other';
        const severity = error.severity || 'medium';

        errorsHtml += `
            <div class="card error-detail-card ${errorType} mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="card-title mb-1">
                            <i class="fas fa-exclamation-circle me-2"></i>
                            ${error.message}
                        </h6>
                        <div>
                            <span class="badge bg-${getSeverityColor(severity)} me-1">${severity.toUpperCase()}</span>
                            <span class="badge bg-secondary">${(error.category || errorType).toUpperCase()}</span>
                        </div>
                    </div>

                    ${error.original_text ? `
                        <div class="mb-2">
                            <small class="text-muted">Found:</small>
                            <code class="ms-2 text-danger">"${error.original_text}"</code>
                        </div>
                    ` : ''}

                    ${error.suggestions && error.suggestions.length > 0 ? `
                        <div class="mb-2">
                            <small class="text-muted">Suggestions:</small>
                            <div class="mt-1">
                                ${error.suggestions.map(suggestion =>
                                    `<button class="correction-btn me-1" onclick="applySuggestion('${error.original_text}', '${suggestion}')">${suggestion}</button>`
                                ).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${error.context ? `
                        <div class="mt-2">
                            <small class="text-muted">Context:</small>
                            <div class="text-muted small mt-1">"${error.context}"</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });

    errorContainer.innerHTML = errorsHtml;
    errorSection.style.display = 'block';
}

function addEnhancedCopyListeners(result) {
    // Copy original text
    const copyOriginalBtn = document.getElementById('copyOriginalBtn');
    if (copyOriginalBtn) {
        copyOriginalBtn.onclick = () => {
            copyToClipboard(result.original_text);
            showNotification('Original text copied!', 'info');
        };
    }

    // Copy corrected text
    const copyCorrectedBtn = document.getElementById('copyCorrectedBtn');
    if (copyCorrectedBtn) {
        copyCorrectedBtn.onclick = () => {
            copyToClipboard(result.corrected_text);
            showNotification('Corrected text copied!', 'success');
        };
    }

    // Accept all corrections
    const acceptCorrectionsBtn = document.getElementById('acceptCorrectionsBtn');
    if (acceptCorrectionsBtn) {
        acceptCorrectionsBtn.onclick = () => {
            inputText.value = result.corrected_text;
            updateCharacterCount();
            showNotification('All corrections applied!', 'success');
        };
    }
}

function getSeverityColor(severity) {
    const colors = {
        'high': 'danger',
        'medium': 'warning',
        'low': 'info'
    };
    return colors[severity] || 'secondary';
}

// Enhanced apply suggestion function
function applySuggestion(original, suggestion) {
    if (!original || !suggestion) return;

    const currentText = inputText.value;
    const newText = currentText.replace(new RegExp(escapeRegExp(original), 'g'), suggestion);
    inputText.value = newText;
    updateCharacterCount();
    showNotification(`Applied: "${suggestion}"`, 'success');
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Enhanced copy to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            console.log('Text copied successfully');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            fallbackCopyTextToClipboard(text);
        });
    } else {
        fallbackCopyTextToClipboard(text);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');
        console.log('Fallback: Text copied');
    } catch (err) {
        console.error('Fallback: Copy failed', err);
    }

    document.body.removeChild(textArea);
}
