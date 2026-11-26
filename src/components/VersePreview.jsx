import React from 'react';
import { calculateGematria, COLORS as DEFAULT_COLORS } from '../data/constants';

const stripNiqqud = (str = '') => str.replace(/[\u0591-\u05C7]/g, '');

const emphasizeAcronymLetters = (phrase, acronymPosition) => {
  return phrase
    .split(' ')
    .map((word) => {
      if (!word) return word;
      if (acronymPosition === 'last') {
        const match = word.match(/([\u0590-\u05FF])([^\u0590-\u05FF]*)$/);
        if (!match) return word;
        const idx = match.index;
        return `${word.slice(0, idx)}<span class="acronym-letter">${match[1]}</span>${match[2]}`;
      }
      const match = word.match(/^([^\u0590-\u05FF]*)([\u0590-\u05FF])/);
      if (!match) return word;
      const idx = match[1].length;
      return `${match[1]}<span class="acronym-letter">${match[2]}</span>${word.slice(idx + 1)}`;
    })
    .join(' ');
};

const renderHighlightedText = (text, highlights, searchMode, acronymPosition) => {
  if (!highlights || highlights.length === 0) return { __html: text };
  const pattern = new RegExp(
    `(${[...new Set(highlights)]
      .sort((a, b) => b.length - a.length)
      .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|')})`,
    'g'
  );
  return {
    __html: text.replace(pattern, (matched) => {
      const inner =
        searchMode === 'acronym'
          ? emphasizeAcronymLetters(matched, acronymPosition)
          : matched;
      return `<mark class="highlight-match">${inner}</mark>`;
    })
  };
};

// Whole-word Gematria highlighter (never highlights partial substrings inside longer words)
const renderGematriaVerse = (text, targetTerm, termColor) => {
  const targetVal = Number(targetTerm);
  if (!text || Number.isNaN(targetVal) || targetVal <= 0) return text;

  const tokens = text.split(/(\s+|־)/);
  return tokens.map((token, idx) => {
    if (!token || /^\s+$/.test(token) || token === '־') {
      return <React.Fragment key={idx}>{token}</React.Fragment>;
    }

    const lettersOnly = stripNiqqud(token).replace(/[^\u05D0-\u05EA]/g, '');
    if (lettersOnly && calculateGematria(lettersOnly) === targetVal) {
      return (
        <mark
          key={idx}
          className="highlight-match"
          style={{
            borderBottomColor: termColor,
            backgroundColor: `${termColor}26`
          }}
        >
          {token}
        </mark>
      );
    }

    return <React.Fragment key={idx}>{token}</React.Fragment>;
  });
};

function VersePreview({
  activePreview,
  setActivePreview,
  activeTerms = [],
  COLORS = DEFAULT_COLORS,
  searchMode = 'exact',
  acronymPosition = 'first',
  t
}) {
  if (!activePreview) return null;

  const palette = COLORS && COLORS.length > 0 ? COLORS : DEFAULT_COLORS;
  const versesByTerm =
    activePreview.verses && typeof activePreview.verses === 'object'
      ? activePreview.verses
      : {};

  const totalMatches = activeTerms.reduce((sum, term) => {
    const list = versesByTerm[term];
    return sum + (Array.isArray(list) ? list.length : 0);
  }, 0);

  return (
    <div className="preview-container">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px',
          padding: '10px 14px',
          borderRadius: '12px',
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          border: '1px solid rgba(56, 189, 248, 0.3)'
        }}
      >
        <h3 style={{ margin: 0, color: '#7dd3fc', fontSize: '16px', fontWeight: '700' }}>
          {t('preview')} {activePreview.name}
        </h3>
        <button
          type="button"
          onClick={() => setActivePreview(null)}
          aria-label="Close preview"
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '8px',
            border: '1px solid rgba(51, 65, 85, 0.85)',
            background: '#090e1a',
            color: '#94a3b8',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {totalMatches === 0 ? (
        <div
          style={{
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(51, 65, 85, 0.65)',
            color: '#94a3b8',
            fontSize: '14px',
            textAlign: 'center'
          }}
        >
          {t('noMatchesInScope') || 'No matches found in this selection.'}
        </div>
      ) : (
        activeTerms.map((term, idx) => {
          const verses = Array.isArray(versesByTerm[term]) ? versesByTerm[term] : [];
          if (verses.length === 0) return null;
          const termColor = palette[idx % palette.length];

          return (
            <div key={term}>
              <h4
                style={{
                  color: termColor,
                  direction: 'rtl',
                  margin: '14px 0 8px 0',
                  fontSize: '15px',
                  fontWeight: '700'
                }}
              >
                {t('matchesFor')} {term} {verses.length === 100 && t('first100')}
              </h4>
              {verses.map((v, i) => (
                <div
                  key={i}
                  className="verse-item"
                  style={{ borderRightColor: termColor }}
                >
                  <div className="verse-ref" style={{ color: termColor }}>
                    {v.ref}
                  </div>
                  {searchMode === 'gematria' ? (
                    <div className="verse-text">
                      {renderGematriaVerse(v.text, term, termColor)}
                    </div>
                  ) : (
                    <div
                      className="verse-text"
                      dangerouslySetInnerHTML={renderHighlightedText(
                        v.text,
                        v.highlights,
                        searchMode,
                        acronymPosition
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}

export default VersePreview;