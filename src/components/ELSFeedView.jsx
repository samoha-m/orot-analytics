import React, { useState, useEffect } from 'react';

function ELSFeedView({ elsData, loading, t, lang }) {
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // FIX: Reset pagination index when new search results arrive
  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [elsData]);

  if (loading) return <h3 style={{ color: '#0056b3' }}>{t('autoDiscovering') || "Processing..."}</h3>;

  const totalMatches = elsData?.matches?.length || 0;
  if (totalMatches === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '60px', color: '#6c757d' }}>
        <h3>{t('noEls') || "No ELS patterns discovered"}</h3>
        <p>{t('noLetterSkip') || "No letter skip occurrences found."}</p>
      </div>
    );
  }

  const activeMatchIndex = Math.min(currentMatchIndex, Math.max(0, totalMatches - 1));
  const selectedMatch = elsData.matches[activeMatchIndex];
  const { feedNodes, term, skip, bookName, isManual } = selectedMatch;

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
    <div style={{ padding: '0 10px 40px 10px', maxWidth: '800px', margin: '0 auto', position: 'relative' }}>

      {/* STICKY HEADER */}
      <div style={{
        position: 'sticky', top: '10px', zIndex: 10,
        backgroundColor: '#fafbfc', border: '1px solid #e9ecef', borderRadius: '12px',
        padding: '15px 20px', marginBottom: '20px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'
      }}>
        <div>
          <h3 style={{ margin: 0, color: '#0056b3' }}>
            {t('sequenceViewer') || "Sequence Viewer"} {!isManual && `"${term}"`}
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6c757d' }}>
            {isManual ? "Start:" : (t('book') || "Book:")} <strong>{bookName}</strong> | {t('skipPattern') || "Skip:"} <strong>{skip} {t('letters') || "letters"}</strong>
          </p>
          {isManual && (
            <div style={{ marginTop: '10px', fontSize: '24px', fontWeight: 'bold', color: '#343a40', direction: 'rtl', letterSpacing: '2px' }}>
              {term}
            </div>
          )}
        </div>

        {/* HIDE PAGINATION IN MANUAL MODE */}
        {!isManual && (
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#ffffff', padding: '4px', borderRadius: '8px', border: '1px solid #ced4da', direction: 'ltr' }}>
            <button
              onClick={handlePrevMatch}
              disabled={activeMatchIndex === 0}
              style={{
                border: 'none', background: 'none', cursor: activeMatchIndex === 0 ? 'default' : 'pointer',
                opacity: activeMatchIndex === 0 ? 0.3 : 1, color: '#0056b3', fontSize: '18px', padding: '8px 14px'
              }}
            >
              ◀
            </button>
            <span style={{ fontSize: '13px', margin: '0 5px', fontWeight: 'bold', color: '#495057' }}>
              {t('patternOf') ? t('patternOf')(activeMatchIndex + 1, totalMatches) : `Pattern ${activeMatchIndex + 1} of ${totalMatches}`}
            </span>
            <button
              onClick={handleNextMatch}
              disabled={activeMatchIndex === totalMatches - 1}
              style={{
                border: 'none', background: 'none', cursor: activeMatchIndex === totalMatches - 1 ? 'default' : 'pointer',
                opacity: activeMatchIndex === totalMatches - 1 ? 0.3 : 1, color: '#0056b3', fontSize: '18px', padding: '8px 14px'
              }}
            >
              ▶
            </button>
          </div>
        )}
      </div>

      {/* FEED READER */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e9ecef', borderRadius: '12px', padding: '35px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
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