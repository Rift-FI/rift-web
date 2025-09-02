/**
 * Platform-Specific WalletConnect Integrations
 * Handles Telegram Mini App and PWA specific features
 */

import { detectPlatformSync } from '@/utils/platform';

// Extend the existing Telegram interface instead of redefining it
declare global {
  interface Window {
    Telegram?: {
      WebApp?: any; // Keep it as any to avoid conflicts with existing types
    };
  }
}

export class WalletConnectPlatform {
  private platform: 'telegram' | 'browser';
  
  constructor() {
    this.platform = detectPlatformSync();
  }

  // Platform Detection
  get isTelegram(): boolean {
    return this.platform === 'telegram';
  }

  get isPWA(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches;
  }

  get isMobile(): boolean {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Notifications
  showNotification(message: string, type: 'success' | 'error' | 'warning' = 'success') {
    switch (this.platform) {
      case 'telegram':
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.showAlert(message);
          if (window.Telegram.WebApp.HapticFeedback) {
            const hapticType = type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'success';
            window.Telegram.WebApp.HapticFeedback.notificationOccurred(hapticType);
          }
        }
        break;
      default:
        if (this.isPWA && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(message);
        } else {
          alert(message);
        }
    }
  }

  // Vibration/Haptic Feedback
  vibrate(intensity: 'light' | 'medium' | 'heavy' = 'medium') {
    switch (this.platform) {
      case 'telegram':
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred(intensity);
        }
        break;
      default:
        const vibrationMap = { light: 100, medium: 200, heavy: 300 };
        navigator.vibrate?.(vibrationMap[intensity]);
    }
  }

  // Clipboard Operations
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (this.platform === 'telegram' && window.Telegram?.WebApp) {
        window.Telegram.WebApp.copyToClipboard(text);
        this.showNotification('Copied to clipboard!');
        return true;
      } else {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  // Sharing
  shareWalletConnectURI(uri: string) {
    if (this.platform === 'telegram' && window.Telegram?.WebApp) {
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(uri)}`;
      window.Telegram.WebApp.openTelegramLink(shareUrl);
    } else if (navigator.share) {
      navigator.share({
        title: 'WalletConnect URI',
        text: 'Connect your wallet to this dApp',
        url: uri
      });
    } else {
      this.copyToClipboard(uri);
    }
  }

  // Storage (Platform-agnostic)
  setItem(key: string, value: string) {
    if (this.platform === 'telegram' && window.Telegram?.WebApp?.CloudStorage) {
      window.Telegram.WebApp.CloudStorage.setItem(key, value);
    } else {
      localStorage.setItem(key, value);
    }
  }

  async getItem(key: string): Promise<string | null> {
    if (this.platform === 'telegram' && window.Telegram?.WebApp?.CloudStorage) {
      return new Promise((resolve) => {
        window.Telegram!.WebApp!.CloudStorage.getItem(key, (error: any, value: string) => {
          resolve(error ? null : value);
        });
      });
    } else {
      return localStorage.getItem(key);
    }
  }

  // Confirmation Dialogs
  async confirm(message: string): Promise<boolean> {
    if (this.platform === 'telegram' && window.Telegram?.WebApp) {
      return new Promise((resolve) => {
        window.Telegram!.WebApp!.showConfirm(message, resolve);
      });
    } else {
      return confirm(message);
    }
  }

  // Theme Integration
  applyTheme() {
    if (this.platform === 'telegram' && window.Telegram?.WebApp) {
      const { themeParams, colorScheme } = window.Telegram.WebApp;
      
      if (themeParams) {
        document.documentElement.style.setProperty('--tg-bg-color', themeParams.bg_color);
        document.documentElement.style.setProperty('--tg-text-color', themeParams.text_color);
        document.documentElement.style.setProperty('--tg-button-color', themeParams.button_color);
        document.documentElement.setAttribute('data-theme', colorScheme);
      }
    }
  }

  // Camera Permissions
  async requestCameraPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Prefer back camera
        } 
      });
      
      // Stop the stream immediately - we just needed to check permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      return false;
    }
  }

  // Push Notifications (PWA)
  async enablePushNotifications(): Promise<boolean> {
    if (!this.isPWA || !('Notification' in window) || !('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.VITE_VAPID_PUBLIC_KEY // Add this to your env
      });

      // Send subscription to backend
      // You'd implement this endpoint to store the subscription
      // await fetch('/api/push-subscriptions', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(subscription)
      // });

      return true;
    } catch (error) {
      console.error('Failed to enable push notifications:', error);
      return false;
    }
  }

  // Deep Linking
  handleDeepLink(url: string) {
    const urlParams = new URLSearchParams(url.split('?')[1]);
    const wcUri = urlParams.get('uri');
    
    if (wcUri) {
      // Emit event or call callback for WalletConnect URI
      window.dispatchEvent(new CustomEvent('walletconnect-uri', { detail: wcUri }));
    }
  }

  // Generate Platform-Specific Share Links
  generateShareLink(uri: string): string {
    if (this.platform === 'telegram') {
      const botUsername = process.env.VITE_TELEGRAM_BOT_USERNAME || 'SphereWalletBot';
      return `https://t.me/${botUsername}?start=wc_${btoa(uri)}`;
    } else {
      return `${window.location.origin}/walletconnect?uri=${encodeURIComponent(uri)}`;
    }
  }

  // Initialize Platform Features
  init() {
    this.applyTheme();

    // Set up deep link handling
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'walletconnect-uri') {
        this.handleDeepLink(event.data.uri);
      }
    });

    // Telegram-specific initialization
    if (this.platform === 'telegram' && window.Telegram?.WebApp) {
      // You can add Telegram-specific initialization here
      console.log('WalletConnect initialized for Telegram Mini App');
    }

    // PWA-specific initialization
    if (this.isPWA) {
      // Register for push notifications if supported
      this.enablePushNotifications().catch(console.error);
      console.log('WalletConnect initialized for PWA');
    }
  }
}

// Global instance
export const walletConnectPlatform = new WalletConnectPlatform();

// Auto-initialize
if (typeof window !== 'undefined') {
  walletConnectPlatform.init();
}
