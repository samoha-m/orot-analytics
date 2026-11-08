import React, { useState } from 'react';

function ELSTargetView({ elsData, loading }) {
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  if (loading) return <h3 style={{ color: '#0056b3' }}>Auto-discovering Equidistant Letter Sequences...</h3>;

  const totalMatches = elsData?.matches?.length || 0;
  if (totalMatches === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '60px', color: '#6c757d' }}>
        <h3>No ELS patterns discovered</h3>
        <p>No letter skip occurrences found for this term in the selected scopes.</p>
      </div>
    );
  }

  const activeMatchIndex = Math.min(currentMatchIndex, Math.max(0, totalMatches - 1));
  const selectedMatch = elsData.matches[activeMatchIndex];
  const { gridLetters, term, skip, bookName, startRef } = selectedMatch;

  // Extract perfectly centered target nodes and their surrounding context
  const matchNodes = [];
  const contextSize = 32; // Amount of context letters to show on the left and right

  gridLetters.forEach((item, idx) => {
    if (item.isMatch) {
      const rightContext = gridLetters.slice(Math.max(0, idx - contextSize), idx);
      const leftContext = gridLetters.slice(idx + 1, Math.min(gridLetters.length, idx + contextSize + 1));
      matchNodes.push({ target: item, rightContext, leftContext, ref: item.ref });
    }
  });

  // Re-inserts the natural spaces and verse boundaries based on worker flags
  const renderContext = (arr) => {
    return arr.map((c) => {
      let spacer = '';
      if (c.isEndOfVerse) spacer = ' ❖ ';
      else if (c.isEndOfWord) spacer = ' ';
      return c.char + spacer;
    }).join('');
  };

  const handleNextMatch = () => {
    if (activeMatchIndex < totalMatches - 1) setCurrentMatchIndex(activeMatchIndex + 1);
  };

  const handlePrevMatch = () => {
    if (activeMatchIndex > 0) setCurrentMatchIndex(activeMatchIndex - 1);
  };

  return (
    <div style={{ padding: '10px' }}>

      {/* HEADER CONTROLS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#0056b3' }}>
            Center-Aligned ELS: "{term}"
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6c757d' }}>
            Found in <strong>{bookName}</strong> ({startRef}) | Skip Pattern: <strong>{skip} letters</strong>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '4px 10px', borderRadius: '6px', border: '1px solid #ced4da' }}>
          <button onClick={handlePrevMatch} disabled={activeMatchIndex === 0} style={{ border: 'none', background: 'none', cursor: activeMatchIndex === 0 ? 'default' : 'pointer', opacity: activeMatchIndex === 0 ? 0.4 : 1, fontWeight: 'bold' }}>◀</button>
          <span style={{ fontSize: '12px', margin: '0 10px', fontWeight: 'bold', color: '#495057' }}>
            Pattern {activeMatchIndex + 1} of {totalMatches}
          </span>
          <button onClick={handleNextMatch} disabled={activeMatchIndex === totalMatches - 1} style={{ border: 'none', background: 'none', cursor: activeMatchIndex === totalMatches - 1 ? 'default' : 'pointer', opacity: activeMatchIndex === totalMatches - 1 ? 0.4 : 1, fontWeight: 'bold' }}>▶</button>
        </div>
      </div>

      {/* MATRIX ALIGNED READER */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e9ecef',
        borderRadius: '12px',
        padding: '30px 20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        marginTop: '20px',
        overflowX: 'hidden' // Prevents mobile breaking
      }}>
        {matchNodes.map((node, i) => (
          <React.Fragment key={i}>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '15px',
              width: '100%',
              margin: '10px 0'
            }}>
              {/* Right Context (Read First in Hebrew RTL) */}
              <div style={{ flex: 1, textAlign: 'left', direction: 'rtl', fontSize: '20px', fontFamily: '"Times New Roman", serif', color: '#495057', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span style={{opacity: 0.3, paddingRight: '5px'}}>...</span> {renderContext(node.rightContext)}
              </div>

              {/* Target Center Pillar */}
              <div style={{
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0056b3',
                color: '#ffffff',
                fontSize: '24px',
                fontWeight: 'bold',
                borderRadius: '8px',
                boxShadow: '0 4px 10px rgba(0,86,179,0.3)',
                flexShrink: 0
              }}>
                {node.target.char}
              </div>

              {/* Left Context (Read Last in Hebrew RTL) */}
              <div style={{ flex: 1, textAlign: 'right', direction: 'rtl', fontSize: '20px', fontFamily: '"Times New Roman", serif', color: '#495057', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {renderContext(node.leftContext)} <span style={{opacity: 0.3, paddingLeft: '5px'}}>...</span>
              </div>
            </div>

            {/* Sub-Verse Reference */}
            <div style={{ textAlign: 'center', fontSize: '13px', color: '#adb5bd', marginBottom: '5px', fontWeight: 'bold' }}>
              {node.ref}
            </div>

            {/* SKIP GAP BADGE */}
            {i < matchNodes.length - 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
                <div style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px dashed #ced4da',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  color: '#6c757d',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ color: '#adb5bd' }}>↓</span>
                  Skipped {skip - 1} letters
                  <span style={{ color: '#adb5bd' }}>↓</span>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default ELSTargetView;