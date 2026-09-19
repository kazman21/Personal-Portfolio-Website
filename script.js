/**
 * ============================================
 * PORTFOLIO HOMEPAGE - JAVASCRIPT
 * ============================================
 * This script handles:
 * 1. Dynamic date display
 * 2. Typing animation for headings (MUNAF then KAZI)
 * 3. Page initialization
 */

// ============================================
// DYNAMIC DATE FUNCTIONALITY
// ============================================

/**
 * Updates the date element with the current date
 * Format: "DD MMM, YYYY" (e.g., "13th Dec, 2025")
 */
function updateDate() {
    const dateElement = document.getElementById('currentDate');
    if (!dateElement) return;
    
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleString('en-US', { month: 'short' });
    const year = now.getFullYear();
    
    // Add ordinal suffix (st, nd, rd, th)
    const ordinalSuffix = getOrdinalSuffix(day);
    
    dateElement.textContent = `${day}${ordinalSuffix} ${month}, ${year}`;
}

/**
 * Returns the ordinal suffix for a given day
 * @param {number} day - The day of the month
 * @returns {string} - The ordinal suffix (st, nd, rd, or th)
 */
function getOrdinalSuffix(day) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

// ============================================
// TYPING ANIMATION FUNCTIONALITY
// ============================================

/**
 * Creates a typing animation effect for text
 * @param {HTMLElement} element - The element containing the text to type
 * @param {string} text - The text to type out
 * @param {number} speed - Typing speed in milliseconds per character
 * @param {Function} callback - Optional callback function to execute after typing completes
 */
function typeText(element, text, speed = 100, callback = null) {
    if (!element) return;
    
    let index = 0;
    element.textContent = '';
    element.classList.remove('complete');
    
    const typeInterval = setInterval(() => {
        if (index < text.length) {
            element.textContent += text[index];
            index++;
        } else {
            clearInterval(typeInterval);
            element.classList.add('complete');
            if (callback) {
                setTimeout(callback, 300); // Small delay before next animation
            }
        }
    }, speed);
}

/**
 * Triggers the slide-up animation for the paragraph
 */
function revealParagraph() {
    const paragraphElement = document.querySelector('.about-text');
    if (paragraphElement) {
        paragraphElement.classList.add('reveal');
    }
}

/**
 * Initializes the typing animations for both headings
 * Animates both mobile and desktop headings simultaneously
 * First types "MUNAF", then immediately types "KAZI"
 * After KAZI completes, the paragraph slides up
 */
function initTypingAnimation() {
    // Get all heading elements (both mobile and desktop)
    const mobileMunaf = document.querySelector('#headingMunafMobile .typing-text');
    const mobileKazi = document.querySelector('#headingKaziMobile .typing-text');
    const desktopMunaf = document.querySelector('#headingMunaf .typing-text');
    const desktopKazi = document.querySelector('#headingKazi .typing-text');

    // Collect all MUNAF and KAZI elements
    const munafElements = [mobileMunaf, desktopMunaf].filter(el => el !== null);
    const kaziElements = [mobileKazi, desktopKazi].filter(el => el !== null);

    if (munafElements.length === 0 || kaziElements.length === 0) return;

    // Respect prefers-reduced-motion: skip animation, show final text immediately
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        munafElements.forEach(el => {
            el.textContent = 'MUNAF';
            el.classList.add('complete');
        });
        kaziElements.forEach(el => {
            el.textContent = 'KAZI';
            el.classList.add('complete');
        });
        revealParagraph();
        return;
    }

    // Animate all MUNAF elements simultaneously
    let munafCompleted = 0;
    const onMunafComplete = () => {
        munafCompleted++;
        if (munafCompleted === munafElements.length) {
            // All MUNAF animations complete, now animate KAZI
            let kaziCompleted = 0;
            const onKaziComplete = () => {
                kaziCompleted++;
                if (kaziCompleted === kaziElements.length) {
                    // All KAZI animations complete, reveal paragraph
                    revealParagraph();
                }
            };
            
            // Animate all KAZI elements simultaneously
            kaziElements.forEach(kaziEl => {
                typeText(kaziEl, 'KAZI', 120, onKaziComplete);
            });
        }
    };
    
    // Start animating all MUNAF elements
    munafElements.forEach(munafEl => {
        typeText(munafEl, 'MUNAF', 120, onMunafComplete);
    });
}

// ============================================
// PAGE INITIALIZATION
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

/**
 * Closes the mobile menu when a same-page anchor link is tapped.
 * Without this, the CSS-checkbox menu stays open on top of the section
 * the user just jumped to.
 */
function setupMobileMenuClose() {
    const toggle = document.getElementById('mobile-menu-toggle');
    if (!toggle) return;

    document.querySelectorAll('.mobile-menu a[href^="#"]').forEach(link => {
        link.addEventListener('click', () => {
            toggle.checked = false;
        });
    });
}

/**
 * Initializes all functionality when the page loads
 */
function init() {
    // Update the date immediately
    updateDate();

    // Setup video background with fallback
    setupVideoBackground();

    // Close mobile menu after an in-page anchor jump
    setupMobileMenuClose();

    // Start typing animation after a short delay for better visual effect
    setTimeout(() => {
        initTypingAnimation();
    }, 500);
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

// Optional: Update date every minute (in case user keeps page open)
setInterval(updateDate, 60000);

