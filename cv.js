/**
 * ============================================
 * CV PAGE - JAVASCRIPT
 * ============================================
 * Handles video background fallback
 */

// ============================================
// VIDEO BACKGROUND FALLBACK
// ============================================

/**
 * Handles video background fallback
 * Shows fallback image if video fails to load
 */
function setupVideoBackground() {
    const video = document.querySelector('.background-video');
    const fallback = document.querySelector('.background-overlay');
    
    if (video && fallback) {
        video.addEventListener('error', () => {
            // If video fails to load, show fallback image
            fallback.style.display = 'block';
        });
        
        // Check if video can play
        video.addEventListener('loadeddata', () => {
            // Video loaded successfully, ensure fallback is hidden
            fallback.style.display = 'none';
        });
    }
}

// ============================================
// PAGE INITIALIZATION
// ============================================

/**
 * Initializes all functionality when the page loads
 */
function init() {
    // Setup video background with fallback
    setupVideoBackground();
}

// ============================================
// EVENT LISTENERS
// ============================================

// Initialize when DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM is already loaded
    init();
}

