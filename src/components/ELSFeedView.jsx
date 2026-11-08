import React, { useState } from 'react';

function ELSFeedView({ elsData, loading, t, lang }) {
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  if (loading) return <h3 style={{ color: '#0056b3' }}>{t('autoDiscovering')}</h3>;

  const totalMatches = elsData?.matches?.length || 0;
  if (totalMatches === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '60px', color: '#6c757d' }}>
        <h3>{t('noEls')}</h3>
        <p>{t('noLetterSkip')}</p>
      </div>
    );
  }

  const activeMatchIndex = Math.min(currentMatchIndex, Math.max(0, totalMatches - 1));
  const selectedMatch = elsData.matches[activeMatchIndex];
  const { feedNodes, term, skip, bookName } = selectedMatch;

  const handleNextMatch = () => {
    if (activeMatchIndex < totalMatches - 1) setCurrentMatchIndex(activeMatchIndex + 1);
  };

  const handlePrevMatch = () => {
    if (activeMatchIndex > 0) setCurrentMatchIndex(activeMatchIndex - 1);
  };

  const renderHighlightedString = (text, highlightIndices) => {
    let result = [];
    for (let i = 0; i < text.length; i++) {
      if (highlightIndices.includes(i)) {
        result.push(
          <span
            key={i}
            style={{
              backgroundColor: '#0056b3', color: '#ffffff', fontWeight: 'bold',
              padding: '2px 4px', margin: '0 2px', borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(0, 86, 179, 0.25)', display: 'inline-block',
              transform: 'scale(1.05)'
            }}
          >
            {text[i]}
          </span>
        );
      } else {
        result.push(text[i]);
      }
    }
    return result;
  };

  return (
    <div style={{ padding: '10px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#0056b3' }}>{t('elsContextFeed')} "{term}"</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6c757d' }}>
            {t('book')} <strong>{bookName}</strong> | {t('skipPattern')} <strong>{skip} {t('letters')}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '4px 10px', borderRadius: '6px', border: '1px solid #ced4da', direction: 'ltr' }}>
          <button onClick={handlePrevMatch} disabled={activeMatchIndex === 0} style={{ border: 'none', background: 'none', cursor: activeMatchIndex === 0 ? 'default' : 'pointer', opacity: activeMatchIndex === 0 ? 0.4 : 1, fontWeight: 'bold' }}>◀</button>
          <span style={{ fontSize: '12px', margin: '0 10px', fontWeight: 'bold', color: '#495057' }}>
            {t('patternOf')(activeMatchIndex + 1, totalMatches)}
          </span>
          <button onClick={handleNextMatch} disabled={activeMatchIndex === totalMatches - 1} style={{ border: 'none', background: 'none', cursor: activeMatchIndex === totalMatches - 1 ? 'default' : 'pointer', opacity: activeMatchIndex === totalMatches - 1 ? 0.4 : 1, fontWeight: 'bold' }}>▶</button>
        </div>
      </div>

      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e9ecef', borderRadius: '12px', padding: '35px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', marginTop: '10px' }}>
        {feedNodes.map((node, i) => (
          <React.Fragment key={i}>
            <div style={{ textAlign: 'right', direction: 'rtl' }}>
              <div style={{ fontSize: '12px', color: '#adb5bd', fontWeight: 'bold', marginBottom: '10px', letterSpacing: '0.5px' }}>
                {node.ref}
              </div>
              <div style={{ fontSize: '24px', fontFamily: '"Times New Roman", serif', color: '#343a40', lineHeight: '1.9' }}>
                {renderHighlightedString(node.text, node.highlights)}
              </div>
            </div>
            {i < feedNodes.length - 1 && (
              <div style={{ textAlign: 'center', color: '#ced4da', margin: '25px 0', fontSize: '28px', letterSpacing: '8px' }}>...</div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default ELSFeedView;