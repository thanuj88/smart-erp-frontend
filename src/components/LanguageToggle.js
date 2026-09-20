import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../i18n';

const LanguageToggle = ({ variant = 'header' }) => {
  const { i18n, t } = useTranslation();
  const current = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];

  return (
    <label className={variant === 'auth' ? 'auth-lang-toggle' : 'lang-toggle lang-toggle--select'}>
      <span className="visually-hidden">{t('language')}</span>
      <select
        className={variant === 'auth' ? 'auth-lang-select' : 'lang-select'}
        value={SUPPORTED_LANGUAGES.some((lang) => lang.code === current) ? current : 'en'}
        onChange={(event) => i18n.changeLanguage(event.target.value)}
        aria-label={t('language')}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </label>
  );
};

LanguageToggle.propTypes = {
  variant: PropTypes.oneOf(['header', 'auth']),
};

export default LanguageToggle;
