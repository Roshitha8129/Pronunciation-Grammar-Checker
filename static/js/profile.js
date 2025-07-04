// ===== PROFILE PAGE JAVASCRIPT =====

// DOM Elements
let profileForm, passwordForm, deleteConfirmation, confirmDelete;
let ratingStars, submitFeedback, exportData;
let progressChart, chartInstance;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeProfile();
});

// Initialize profile page
function initializeProfile() {
    // Get DOM elements
    getDOMElements();
    
    // Add event listeners
    addEventListeners();
    
    // Initialize progress chart
    initializeProgressChart();
    
    // Initialize rating stars
    initializeRatingStars();
    
    console.log('Profile page initialized');
}

// Get DOM elements
function getDOMElements() {
    profileForm = document.getElementById('profileForm');
    passwordForm = document.getElementById('passwordForm');
    deleteConfirmation = document.getElementById('deleteConfirmation');
    confirmDelete = document.getElementById('confirmDelete');
    ratingStars = document.querySelectorAll('.rating-stars i');
    submitFeedback = document.getElementById('submitFeedback');
    exportData = document.getElementById('exportData');
    progressChart = document.getElementById('progressChart');
}

// Add event listeners
function addEventListeners() {
    // Profile form
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    // Password form
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordChange);
    }
    
    // Cancel button
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', resetProfileForm);
    }
    
    // Delete confirmation
    if (deleteConfirmation) {
        deleteConfirmation.addEventListener('input', handleDeleteConfirmation);
    }
    
    if (confirmDelete) {
        confirmDelete.addEventListener('click', handleAccountDeletion);
    }
    
    // Feedback submission
    if (submitFeedback) {
        submitFeedback.addEventListener('click', handleFeedbackSubmission);
    }
    
    // Data export
    if (exportData) {
        exportData.addEventListener('click', handleDataExport);
    }
    
    // Form validation
    addFormValidation();
}

// Handle profile update
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const formData = new FormData(profileForm);
    const data = Object.fromEntries(formData);
    
    // Validate form data
    if (!validateProfileData(data)) {
        return;
    }
    
    // Show loading state
    const submitBtn = profileForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Updating...';
    
    try {
        const response = await fetch('/api/update-profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Profile updated successfully!', 'success');
        } else {
            showNotification(result.message || 'Failed to update profile', 'error');
        }
        
    } catch (error) {
        console.error('Profile update error:', error);
        showNotification('Error updating profile. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Handle password change
async function handlePasswordChange(e) {
    e.preventDefault();
    
    const formData = new FormData(passwordForm);
    const data = Object.fromEntries(formData);
    
    // Validate passwords
    if (!validatePasswordChange(data)) {
        return;
    }
    
    // Show loading state
    const submitBtn = passwordForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Changing...';
    
    try {
        const response = await fetch('/api/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Password changed successfully!', 'success');
            passwordForm.reset();
        } else {
            showNotification(result.message || 'Failed to change password', 'error');
        }
        
    } catch (error) {
        console.error('Password change error:', error);
        showNotification('Error changing password. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Validate profile data
function validateProfileData(data) {
    if (!data.full_name || data.full_name.trim().length < 2) {
        showNotification('Full name must be at least 2 characters long', 'error');
        return false;
    }
    
    if (data.email && !isValidEmail(data.email)) {
        showNotification('Please enter a valid email address', 'error');
        return false;
    }
    
    return true;
}

// Validate password change
function validatePasswordChange(data) {
    if (!data.current_password) {
        showNotification('Current password is required', 'error');
        return false;
    }
    
    if (!data.new_password) {
        showNotification('New password is required', 'error');
        return false;
    }
    
    if (data.new_password !== data.confirm_password) {
        showNotification('New passwords do not match', 'error');
        return false;
    }
    
    const passwordValidation = validatePassword(data.new_password);
    if (!passwordValidation.isValid) {
        showNotification('Password must be stronger: ' + passwordValidation.feedback.missing.join(', '), 'error');
        return false;
    }
    
    return true;
}

// Reset profile form
function resetProfileForm() {
    profileForm.reset();
    showNotification('Changes discarded', 'info');
}

// Handle delete confirmation input
function handleDeleteConfirmation() {
    const value = deleteConfirmation.value;
    confirmDelete.disabled = value !== 'DELETE';
}

// Handle account deletion
async function handleAccountDeletion() {
    if (deleteConfirmation.value !== 'DELETE') {
        showNotification('Please type DELETE to confirm', 'error');
        return;
    }
    
    // Show loading state
    confirmDelete.disabled = true;
    confirmDelete.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Deleting...';
    
    try {
        const response = await fetch('/api/delete-account', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Account deleted successfully. Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else {
            showNotification(result.message || 'Failed to delete account', 'error');
        }
        
    } catch (error) {
        console.error('Account deletion error:', error);
        showNotification('Error deleting account. Please try again.', 'error');
    } finally {
        confirmDelete.disabled = false;
        confirmDelete.innerHTML = 'Delete Account';
    }
}

// Initialize rating stars
function initializeRatingStars() {
    let selectedRating = 0;
    
    ratingStars.forEach(star => {
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.dataset.rating);
            updateStarDisplay(selectedRating);
        });
        
        star.addEventListener('mouseover', function() {
            const rating = parseInt(this.dataset.rating);
            updateStarDisplay(rating);
        });
    });
    
    // Reset on mouse leave
    const starsContainer = document.querySelector('.rating-stars');
    if (starsContainer) {
        starsContainer.addEventListener('mouseleave', function() {
            updateStarDisplay(selectedRating);
        });
    }
    
    function updateStarDisplay(rating) {
        ratingStars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }
}

// Handle feedback submission
async function handleFeedbackSubmission() {
    const feedbackType = document.getElementById('feedbackType').value;
    const feedbackMessage = document.getElementById('feedbackMessage').value;
    const rating = document.querySelectorAll('.rating-stars i.active').length;
    
    if (!feedbackMessage.trim()) {
        showNotification('Please enter your feedback message', 'error');
        return;
    }
    
    // Show loading state
    submitFeedback.disabled = true;
    submitFeedback.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Sending...';
    
    try {
        const response = await fetch('/api/submit-feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: feedbackType,
                message: feedbackMessage,
                rating: rating
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Thank you for your feedback!', 'success');
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('feedbackModal'));
            if (modal) modal.hide();
            // Reset form
            document.getElementById('feedbackForm').reset();
            ratingStars.forEach(star => star.classList.remove('active'));
        } else {
            showNotification(result.message || 'Failed to submit feedback', 'error');
        }
        
    } catch (error) {
        console.error('Feedback submission error:', error);
        showNotification('Error submitting feedback. Please try again.', 'error');
    } finally {
        submitFeedback.disabled = false;
        submitFeedback.innerHTML = 'Send Feedback';
    }
}

// Handle data export
async function handleDataExport() {
    const exportProfile = document.getElementById('exportProfile').checked;
    const exportStats = document.getElementById('exportStats').checked;
    const exportHistory = document.getElementById('exportHistory').checked;
    
    if (!exportProfile && !exportStats && !exportHistory) {
        showNotification('Please select at least one data type to export', 'error');
        return;
    }
    
    // Show loading state
    exportData.disabled = true;
    exportData.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Exporting...';
    
    try {
        const response = await fetch('/api/export-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                include_profile: exportProfile,
                include_stats: exportStats,
                include_history: exportHistory
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pronunciation_detector_data.json';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showNotification('Data exported successfully!', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('exportModal'));
        if (modal) modal.hide();
        
    } catch (error) {
        console.error('Data export error:', error);
        showNotification('Error exporting data. Please try again.', 'error');
    } finally {
        exportData.disabled = false;
        exportData.innerHTML = 'Export Data';
    }
}

// Initialize progress chart
function initializeProgressChart() {
    if (!progressChart) return;
    
    const ctx = progressChart.getContext('2d');
    
    // Sample data - in real app, this would come from the backend
    const chartData = {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
        datasets: [{
            label: 'Pronunciation Score',
            data: [65, 72, 78, 82, 85, 88],
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.4
        }, {
            label: 'Grammar Score',
            data: [70, 75, 80, 83, 87, 90],
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            tension: 0.4
        }]
    };
    
    const config = {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Your Progress Over Time'
                },
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    };
    
    // Check if Chart.js is available
    if (typeof Chart !== 'undefined') {
        chartInstance = new Chart(ctx, config);
    } else {
        // Fallback if Chart.js is not loaded
        progressChart.innerHTML = '<p class="text-center text-muted">Chart loading...</p>';
        console.warn('Chart.js not loaded');
    }
}

// Add form validation
function addFormValidation() {
    // Real-time email validation
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const email = this.value.trim();
            if (email && !isValidEmail(email)) {
                this.classList.add('is-invalid');
                showNotification('Please enter a valid email address', 'error');
            } else {
                this.classList.remove('is-invalid');
            }
        });
    }
    
    // Password strength indicator
    const newPasswordInput = document.getElementById('new_password');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function() {
            const password = this.value;
            if (password) {
                const validation = validatePassword(password);
                updatePasswordStrengthIndicator(validation);
            }
        });
    }
}

// Update password strength indicator
function updatePasswordStrengthIndicator(validation) {
    // This would update a visual indicator of password strength
    // For now, just log the strength
    console.log('Password strength:', validation.feedback.strength);
}

// Utility functions
function showNotification(message, type) {
    if (window.PronunciationDetector) {
        window.PronunciationDetector.showNotification(message, type);
    }
}

function isValidEmail(email) {
    if (window.PronunciationDetector) {
        return window.PronunciationDetector.isValidEmail(email);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    if (window.PronunciationDetector) {
        return window.PronunciationDetector.validatePassword(password);
    }
    // Fallback validation
    return {
        isValid: password.length >= 8,
        feedback: { strength: 'Unknown', missing: [] }
    };
}
