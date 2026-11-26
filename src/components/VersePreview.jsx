import React from 'react';
import { calculateGematria, COLORS as DEFAULT_COLORS } from '../data/constants';

const stripNiqqud = (str = '') => str.replace(/[\u0591-\u05C7]/g, '');

const normalizeFinalLetters = (str = '') =>
  str
    .replace(/ך/g, 'כ')
    .replace(/ם/g, 'מ')
    .replace(/ן/g, 'נ')
    .replace(/ף/g, 'פ')
    .replace(/ץ/g, 'צ');

function VersePreview({
  activePreview,
  setActivePreview,
  activeTerms = [],
  COLORS = DEFAULT_COLORS,
  searchMode = 'exact',
  acronymPosition = 'first',
  t
}) {
  if (!activePreview || !activePreview.verses || activePreview.verses.length === 0) {
    return null;
  }

  const palette = COLORS && COLORS.length > 0 ? COLORS : DEFAULT_COLORS;

  const getTermColor = (termIndex) => palette[termIndex % palette.length] || '#fbbf24';

  // Render a single verse with mode-specific highlighting
  const renderHighlightedVerse = (text) => {
    if (!text || !activeTerms || activeTerms.length === 0) return text;

    // 1. GEMATRIA MODE: Strictly evaluate WHOLE words (never substrings inside longer words)
    if (searchMode === 'gematria') {
      const targetMap = new Map();
      activeTerms.forEach((term, idx) => {
        const num = Number(term);
        if (!Number.isNaN(num) && num > 0 && !targetMap.has(num)) {
          targetMap.set(num, getTermColor(idx));
        }
      });

      // Split into whitespace & word tokens, also splitting on Hebrew maqaf (־)
      const tokens = text.split(/(\s+|־)/);

      return tokens.map((token, idx) => {
        if (!token || /^\s+$/.test(token) || token === '־') {
          return <React.Fragment key={idx}>{token}</React.Fragment>;
        }

        const lettersOnly = stripNiqqud(token).replace(/[^\u05D0-\u05EA]/g, '');
        if (!lettersOnly) {
          return <React.Fragment key={idx}>{token}</React.Fragment>;
        }

        const wordVal = calculateGematria(lettersOnly);
        const matchedColor = targetMap.get(wordVal);

        if (matchedColor) {
          return (
            <span
              key={idx}
              className="highlight-match"
              style={{
                borderBottomColor: matchedColor,
                backgroundColor: `${matchedColor}26`
              }}
            >
              {token}
            </span>
          );
        }

        return <React.Fragment key={idx}>{token}</React.Fragment>;
      });
    }

    // 2. LETTER MODE: Highlight matching Hebrew letters
    if (searchMode === 'letter') {
      const letterMap = new Map();
      activeTerms.forEach((term, idx) => {
        const cleanTerm = normalizeFinalLetters(stripNiqqud(term).replace(/[^\u05D0-\u05EA]/g, ''));
        for (const ch of cleanTerm) {
          if (!letterMap.has(ch)) {
            letterMap.set(ch, getTermColor(idx));
          }
        }
      });

      return Array.from(text).map((ch, idx) => {
        const normCh = normalizeFinalLetters(stripNiqqud(ch));
        const color = letterMap.get(normCh);
        if (color) {
          return (
            <span
              key={idx}
              className="highlight-match"
              style={{
                padding: '0 2px',
                borderBottomColor: color,
                backgroundColor: `${color}26`
              }}
            >
              {ch}
            </span>
          );
        }
        return <React.Fragment key={idx}>{ch}</React.Fragment>;
      });
    }

    // 3. ACRONYM MODE (ראשי תיבות / סופי תיבות)
    if (searchMode === 'acronym') {
      const parts = text.split(/(\s+)/);
      const wordEntries = [];

      parts.forEach((part, partIdx) => {
        if (!/^\s+$/.test(part) && part.length > 0) {
          const letters = normalizeFinalLetters(stripNiqqud(part).replace(/[^\u05D0-\u05EA]/g, ''));
          if (letters.length > 0) {
            const keyLetter =
              acronymPosition === 'last' ? letters[letters.length - 1] : letters[0];
            wordEntries.push({ partIdx, keyLetter });
          }
        }
      });

      const highlightedParts = new Map();

      activeTerms.forEach((term, termIdx) => {
        const cleanTerm = normalizeFinalLetters(stripNiqqud(term).replace(/[^\u05D0-\u05EA]/g, ''));
        const len = cleanTerm.length;
        if (len === 0) return;

        for (let i = 0; i <= wordEntries.length - len; i++) {
          let candidate = '';
          for (let j = 0; j < len; j++) {
            candidate += wordEntries[i + j].keyLetter;
          }
          if (candidate === cleanTerm) {
            const color = getTermColor(termIdx);
            for (let j = 0; j < len; j++) {
              highlightedParts.set(wordEntries[i + j].partIdx, color);
            }
          }
        }
      });

      return parts.map((part, partIdx) => {
        const color = highlightedParts.get(partIdx);
        if (!color) {
          return <React.Fragment key={partIdx}>{part}</React.Fragment>;
        }

        const chars = Array.from(part);
        let targetCharIdx = -1;
        if (acronymPosition === 'last') {
          for (let i = chars.length - 1; i >= 0; i--) {
            if (/[\u05D0-\u05EA]/.test(chars[i])) {
              targetCharIdx = i;
              break;
            }
          }
        } else {
          for (let i = 0; i < chars.length; i++) {
            if (/[\u05D0-\u05EA]/.test(chars[i])) {
              targetCharIdx = i;
              break;
            }
          }
        }

        return (
          <span
            key={partIdx}
            className="highlight-match"
            style={{
              borderBottomColor: color,
              backgroundColor: `${color}22`
            }}
          >
            {chars.map((c, cIdx) =>
              cIdx === targetCharIdx ? (
                <span key={cIdx} className="acronym-letter">
                  {c}
                </span>
              ) : (
                <React.Fragment key={cIdx}>{c}</React.Fragment>
              )
            )}
          </span>
        );
      });
    }

    // 4. EXACT TEXT SEARCH MODE
    const cleanedTerms = activeTerms
      .map((term, idx) => ({
        raw: stripNiqqud(term.trim()),
        color: getTermColor(idx)
      }))
      .filter((item) => item.raw.length > 0)
      .sort((a, b) => b.raw.length - a.raw.length);

    if (cleanedTerms.length === 0) return text;

    const escaped = cleanedTerms.map((item) =>
      item.raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    const regex = new RegExp(`(${escaped.join('|')})`, 'g');
    const segments = stripNiqqud(text).split(regex);

    return segments.map((seg, idx) => {
      const matched = cleanedTerms.find((item) => item.raw === seg);
      if (matched) {
        return (
          <span
            key={idx}
            className="highlight-match"
            style={{
              borderBottomColor: matched.color,
              backgroundColor: `${matched.color}26`
            }}
          >
            {seg}
          </span>
        );
      }
      return <React.Fragment key={idx}>{seg}</React.Fragment>;
    });
  };

  return (
    <div className="preview-container">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '14px',
          padding: '10px 14px',
          borderRadius: '12px',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(56, 189, 248, 0.3)'
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#e2e8f0' }}>
          {activePreview.title || activePreview.name || t('versePreview')}{' '}
          <span style={{ color: '#38bdf8', marginInlineStart: '6px' }}>
            ({activePreview.verses.length})
          </span>
        </div>

        <button
          type="button"
          onClick={() => setActivePreview(null)}
          aria-label="Close preview"
          style={{
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(71, 85, 105, 0.7)',
            borderRadius: '8px',
            color: '#94a3b8',
            padding: '4px 10px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>

      {activePreview.verses.map((v, idx) => {
        const refLabel = typeof v === 'object' ? v.ref || v.reference || '' : '';
        const verseText = typeof v === 'object' ? v.text || v.verse || '' : String(v);

        return (
          <div key={idx} className="verse-item">
            {refLabel && <div className="verse-ref">{refLabel}</div>}
            <div className="verse-text">{renderHighlightedVerse(verseText)}</div>
          </div>
        );
      })}
    </div>
  );
}

export default VersePreview;