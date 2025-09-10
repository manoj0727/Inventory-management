/**
 * Global Scroll Fix JavaScript
 * Ensures proper scrolling across all pages and iframes
 */

(function() {
    'use strict';
    
    // Function to fix scrolling issues
    function fixScrolling() {
        // Ensure body can scroll
        document.body.style.overflowY = 'auto';
        document.body.style.overflowX = 'hidden';
        document.body.style.height = 'auto';
        document.body.style.minHeight = '100vh';
        
        // Ensure html can scroll
        document.documentElement.style.overflow = 'visible';
        document.documentElement.style.height = '100%';
        
        // Fix for iOS devices
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            document.body.style.webkitOverflowScrolling = 'touch';
            document.body.style.position = 'relative';
        }
        
        // Fix containers
        const containers = document.querySelectorAll('.dashboard-wrapper, .container, main');
        containers.forEach(container => {
            container.style.overflow = 'visible';
            container.style.minHeight = '100vh';
        });
        
        // Log for debugging
        console.log('Scroll fix applied to:', window.location.pathname);
    }
    
    // Apply fix when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixScrolling);
    } else {
        fixScrolling();
    }
    
    // Apply fix after all resources load
    window.addEventListener('load', fixScrolling);
    
    // Reapply on resize
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(fixScrolling, 250);
    });
    
    // Fix for iframes
    if (window.parent !== window) {
        // We're in an iframe
        window.parent.postMessage({
            type: 'iframe-height',
            height: document.body.scrollHeight
        }, '*');
        
        // Monitor height changes
        const observer = new MutationObserver(function() {
            window.parent.postMessage({
                type: 'iframe-height',
                height: document.body.scrollHeight
            }, '*');
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true
        });
    }
    
    // Listen for iframe messages (if we're the parent)
    if (window.parent === window) {
        window.addEventListener('message', function(e) {
            if (e.data.type === 'iframe-height') {
                const iframes = document.querySelectorAll('iframe');
                iframes.forEach(iframe => {
                    if (iframe.contentWindow === e.source) {
                        iframe.style.height = e.data.height + 'px';
                    }
                });
            }
        });
    }
})();