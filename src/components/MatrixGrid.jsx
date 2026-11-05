import React, { useState, useRef } from 'react';

function MatrixGrid({ elsData, loading }) {
  const matrixRef = useRef(null);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  if (loading) return <h3 style={{ color: '#0056b3' }}>Auto-discovering Equidistant Letter Sequences...</h3>;

  if (!elsData || !elsData.matches || elsData.matches.length === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '60px', color: '#6c757d' }}>
        <h3>No ELS patterns discovered</h3>
        <p>No letter skip occurrences found for this term in the selected scopes.</p>
      </div>
    );
  }

  const matches = elsData.matches;
  const totalMatches = matches.length;
  const activeMatchIndex = Math.min(currentMatchIndex, totalMatches - 1);
  const selectedMatch = matches[activeMatchIndex];
  const { gridLetters, width, term, skip, bookName, startRef } = selectedMatch;

  const handleNextMatch = () => {
    if (activeMatchIndex < totalMatches - 1) setCurrentMatchIndex(activeMatchIndex + 1);
  };

  const handlePrevMatch = () => {
    if (activeMatchIndex > 0) setCurrentMatchIndex(activeMatchIndex - 1);
  };

  const handleExportPNG = () => {
    const gridEl = matrixRef.current;
    if (!gridEl) return;

    const cols = width;
    const rows = Math.ceil(gridLetters.length / cols);
    const cellWidth = 36;
    const cellHeight = 36;
    const headerHeight = 60;

    const canvas = document.createElement('canvas');
    canvas.width = cols * cellWidth + 40;
    canvas.height = rows * cellHeight + headerHeight + 40;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`Orot ELS Matrix - ${bookName} | Term: "${term}" (Skip: ${skip})`, 20, 38);

    ctx.font = 'bold 16px sans-serif';
    gridLetters.forEach((item, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const x = 20 + col * cellWidth + cellWidth / 2;
      const y = headerHeight + 20 + row * cellHeight + cellHeight / 2;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (item.isMatch) {
        ctx.fillStyle = '#0056b3';
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText(item.char, x, y);
      } else {
        ctx.fillStyle = 'rgba(156, 163, 175, 0.4)';
        ctx.fillText(item.char, x, y);
      }
    });

    const link = document.createElement('a');
    link.download = `Orot_ELS_${term}_skip${skip}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div style={{ padding: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#0056b3' }}>ELS Pattern Discovered: "{term}"</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6c757d' }}>
            Found in <strong>{bookName}</strong> ({startRef}) at <strong>Skip: {skip} letters</strong>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '4px 10px', borderRadius: '6px', border: '1px solid #ced4da' }}>
            <button onClick={handlePrevMatch} disabled={activeMatchIndex === 0} style={{ border: 'none', background: 'none', cursor: activeMatchIndex === 0 ? 'default' : 'pointer', opacity: activeMatchIndex === 0 ? 0.4 : 1, fontWeight: 'bold' }}>◀</button>
            <span style={{ fontSize: '12px', margin: '0 10px', fontWeight: 'bold', color: '#495057' }}>
              Pattern {activeMatchIndex + 1} of {totalMatches}
            </span>
            <button onClick={handleNextMatch} disabled={activeMatchIndex === totalMatches - 1} style={{ border: 'none', background: 'none', cursor: activeMatchIndex === totalMatches - 1 ? 'default' : 'pointer', opacity: activeMatchIndex === totalMatches - 1 ? 0.4 : 1, fontWeight: 'bold' }}>▶</button>
          </div>
          <button onClick={handleExportPNG} className="btn btn-export" style={{ backgroundColor: '#111827', color: '#fff' }}>
            📥 Export Grid (PNG)
          </button>
        </div>
      </div>

      <div ref={matrixRef} style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '12px', overflowX: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', display: 'inline-block', minWidth: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${width}, 34px)`, gap: '6px', justifyContent: 'center' }}>
          {gridLetters.map((cell, idx) => (
            <div key={idx} title={cell.ref ? `${cell.ref} (Index: ${cell.letterIdx})` : `Index: ${idx}`} style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', fontSize: '15px', fontWeight: cell.isMatch ? 'bold' : 'normal', backgroundColor: cell.isMatch ? '#0056b3' : 'rgba(255, 255, 255, 0.03)', color: cell.isMatch ? '#ffffff' : 'rgba(156, 163, 175, 0.45)', border: cell.isMatch ? '2px solid #60a5fa' : '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
              {cell.char}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MatrixGrid;