import fs from 'fs';
import path from 'path';
import en from './en';
import si from './si';
import de from './de';
import es from './es';
import it_ from './it';
import fr from './fr';

const locales = { en, si, de, es, it: it_, fr };
const source = fs.readFileSync(path.join(__dirname, '../pages/SellItems.js'), 'utf8');

// Static t('key') calls. i18next splits keys on "." and ":" by default, so sentence keys never resolve.
const usedKeys = [
  ...new Set(
    [...source.matchAll(/\bt\(\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g)].map((m) => m[1].replace(/\\(['\\])/g, '$1'))
  ),
];

describe('POS translation keys', () => {
  it('finds the keys used by the POS screen', () => {
    expect(usedKeys.length).toBeGreaterThan(100);
  });

  it('uses no key that i18next would split on "." or ":"', () => {
    const bad = usedKeys.filter((k) => /[.:]/.test(k));
    expect(bad).toEqual([]);
  });

  Object.entries(locales).forEach(([code, messages]) => {
    it(`${code} has every key the POS screen uses`, () => {
      const missing = usedKeys.filter((k) => typeof messages[k] !== 'string' || !messages[k].trim());
      expect(missing).toEqual([]);
    });
  });

  it('has no leftover hardcoded English in the checked spots', () => {
    expect(source).not.toMatch(/setError\('[A-Za-z]/);
    expect(source).not.toMatch(/setSuccess\('[A-Za-z]/);
    expect(source).not.toMatch(/\n\s+Void\r?\n/);
    expect(source).not.toMatch(/title="Clear order"/);
  });
});
