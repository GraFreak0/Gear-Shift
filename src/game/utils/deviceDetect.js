/**
 * Device detection utility.
 * Detects whether the game is running on a mobile/touch device or a PC.
 * Result is cached after first call.
 */

let _isMobile = null;

export function isMobile() {
    if (_isMobile !== null) return _isMobile;
    const ua = navigator.userAgent || '';
    const hasTouchScreen = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
    const mobileUA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(ua);
    _isMobile = hasTouchScreen && mobileUA;
    return _isMobile;
}

export function isPC() {
    return !isMobile();
}

export function getPlatformLabel() {
    return isMobile() ? 'mobile' : 'pc';
}