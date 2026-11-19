import React from 'react';

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
    `(${[...new Set(highlights)].sort((a, b) => b.length - a.length).map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'g'
  );
  return {
    __html: text.replace(pattern, (matched) => {
      const inner = searchMode === 'acronym'
        ? emphasizeAcronymLetters(matched, acronymPosition)
        : matched;
      return `<mark class="highlight-match">${inner}</mark>`;
    })
  };
};

function VersePreview({ activePreview, setActivePreview, activeTerms, COLORS, searchMode, acronymPosition, t }) {
  if (!activePreview) return null;

  return (
    <div className="preview-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, color: '#0056b3' }}>{t('preview')} {activePreview.name}</h3>
        <button onClick={() => setActivePreview(null)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>✖</button>
      </div>

      {activeTerms.map((term, idx) => {
        const verses = activePreview.verses[term] || [];
        if (verses.length === 0) return null;
        return (
          <div key={term}>
            <h4 style={{ color: COLORS[idx % COLORS.length], direction: 'rtl' }}>
              {t('matchesFor')} {term} {verses.length === 100 && t('first100')}
            </h4>
            {verses.map((v, i) => (
              <div key={i} className="verse-item" style={{ borderRightColor: COLORS[idx % COLORS.length] }}>
                <div className="verse-ref">{v.ref}</div>
                <div
                  className="verse-text"
                  dangerouslySetInnerHTML={renderHighlightedText(v.text, v.highlights, searchMode, acronymPosition)}
                />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default VersePreview;