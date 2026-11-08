import React, { useEffect, useRef } from 'react';

export const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || '';

const SCRIPT_SRC = 'https://www.google.com/recaptcha/api.js?render=explicit';
let scriptPromise = null;

function loadRecaptcha() {
  if (window.grecaptcha && window.grecaptcha.render) return Promise.resolve(window.grecaptcha);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => window.grecaptcha.ready(() => resolve(window.grecaptcha));
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('Could not load reCAPTCHA'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

/**
 * Google reCAPTCHA checkbox. Renders nothing when REACT_APP_RECAPTCHA_SITE_KEY is not set.
 * `onToken` gets the token when solved and null when it expires or is reset.
 * Change `resetKey` to clear the widget (a token is single use).
 */
const Captcha = ({ onToken, resetKey = 0 }) => {
  const holder = useRef(null);
  const widgetId = useRef(null);
  const callback = useRef(onToken);
  callback.current = onToken;

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY || !holder.current) return undefined;
    let cancelled = false;
    loadRecaptcha()
      .then((grecaptcha) => {
        if (cancelled || !holder.current) return;
        holder.current.innerHTML = '';
        widgetId.current = grecaptcha.render(holder.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: (token) => callback.current?.(token),
          'expired-callback': () => callback.current?.(null),
          'error-callback': () => callback.current?.(null),
        });
      })
      .catch(() => callback.current?.(null));
    return () => {
      cancelled = true;
      widgetId.current = null;
    };
  }, [resetKey]);

  if (!RECAPTCHA_SITE_KEY) return null;
  return <div ref={holder} className="my-3" />;
};

export default Captcha;
