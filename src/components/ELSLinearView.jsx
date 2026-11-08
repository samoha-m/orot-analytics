import React, { useState, useEffect, useRef } from 'react';

function ELSLinearView({ elsData, loading }) {
  const containerRef = useRef(null);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [arcs, setArcs] = useState([]);

  // Safely compute matches before any conditional returns
  const totalMatches = elsData?.matches?.length || 0;
  const activeMatchIndex = Math.min(currentMatchIndex, Math.max(0, totalMatches - 1));
  const selectedMatch = totalMatches > 0 ? elsData.matches[activeMatchIndex] : null;

  // ALL HOOKS MUST BE AT THE TOP (Rule of Hooks)
  useEffect(() => {
    const calculateArcs = () => {
      if (!containerRef.current) return;

      const elements = containerRef.current.querySelectorAll('.els-highlight-char');
      if (elements.length < 2) {
        setArcs([]);
        return;
      }

      const containerRect = containerRef.current.getBoundingClientRect();
      const newArcs = [];

      for (let i = 0; i < elements.length - 1; i++) {
        const startEl = elements[i];
        const endEl = elements[i + 1];

        const startRect = startEl.getBoundingClientRect();
        const endRect = endEl.getBoundingClientRect();

        // Coordinates relative to the scroll container
        const x1 = startRect.left - containerRect.left + startRect.width / 2;
        const y1 = startRect.top - containerRect.top + startRect.height / 2;
        const x2 = endRect.left - containerRect.left + endRect.width / 2;
        const y2 = endRect.top - containerRect.top + endRect.height / 2;

        // Create a bezier control offset based on distance to make natural curves
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Curve direction curves upwards
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2 - Math.min(distance * 0.35, 80);

        newArcs.push({
          d: `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`,
          id: i
        });
      }

      setArcs(newArcs);
    };

    if (totalMatches > 0) {
      // Calculate immediately and delay briefly to let DOM layout settle
      calculateArcs();
      const timeoutId = setTimeout(calculateArcs, 100);

      window.addEventListener('resize', calculateArcs);
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', calculateArcs);
      };
    }
  }, [activeMatchIndex, elsData, totalMatches]);

  // NOW we can safely do our conditional early returns
  if (loading) return <h3 style={{ color: '#0056b3' }}>Auto-discovering Equidistant Letter Sequences...</h3>;

  if (totalMatches === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '60px', color: '#6c757d' }}>
        <h3>No ELS patterns discovered</h3>
        <p>No letter skip occurrences found for this term in the selected scopes.</p>
      </div>
    );
  }

  const { gridLetters, term, skip, bookName, startRef } = selectedMatch;

  const handleNextMatch = () => {
    if (activeMatchIndex < totalMatches - 1) setCurrentMatchIndex(activeMatchIndex + 1);
  };

  const handlePrevMatch = () => {
    if (activeMatchIndex > 0) setCurrentMatchIndex(activeMatchIndex - 1);
  };

  const handleExportPNG = () => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement('canvas');
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width + 40;
    canvas.height = rect.height + 100;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0056b3';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`Orot ELS Arc Overlay: "${term}"`, 20, 40);
    ctx.fillStyle = '#6c757d';
    ctx.font = '14px sans-serif';
    ctx.fillText(`In ${bookName} (${startRef}) | Skip: ${skip} letters`, 20, 65);

    ctx.font = '18px Times New Roman';
    ctx.fillStyle = '#343a40';

    const textLines = container.innerText.split('\n');
    let yOffset = 110;
    textLines.forEach(line => {
      ctx.fillText(line, 20, yOffset);
      yOffset += 28;
    });

    const link = document.createElement('a');
    link.download = `Orot_ELS_Linear_${term}_skip${skip}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div style={{ padding: '10px' }}>
      {/* HEADER CONTROLS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#0056b3' }}>
            ELS Arc Viewer: "{term}"
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6c757d' }}>
            Linear reading in <strong>{bookName}</strong> ({startRef}) with <strong>Skip: {skip}</strong> connection curves.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '4px 10px', borderRadius: '6px', border: '1px solid #ced4da' }}>
            <button
              onClick={handlePrevMatch}
              disabled={activeMatchIndex === 0}
              style={{ border: 'none', background: 'none', cursor: activeMatchIndex === 0 ? 'default' : 'pointer', opacity: activeMatchIndex === 0 ? 0.4 : 1, fontWeight: 'bold' }}
            >
              ◀
            </button>
            <span style={{ fontSize: '12px', margin: '0 10px', fontWeight: 'bold', color: '#495057' }}>
              Pattern {activeMatchIndex + 1} of {totalMatches}
            </span>
            <button
              onClick={handleNextMatch}
              disabled={activeMatchIndex === totalMatches - 1}
              style={{ border: 'none', background: 'none', cursor: activeMatchIndex === totalMatches - 1 ? 'default' : 'pointer', opacity: activeMatchIndex === totalMatches - 1 ? 0.4 : 1, fontWeight: 'bold' }}
            >
              ▶
            </button>
          </div>

          <button onClick={handleExportPNG} className="btn btn-export" style={{ backgroundColor: '#28a745', color: 'white' }}>
            📸 Snapshot PNG
          </button>
        </div>
      </div>

      {/* RENDER SPACE */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          backgroundColor: '#fafbfc',
          border: '1px solid #e9ecef',
          borderRadius: '12px',
          padding: '40px 30px',
          direction: 'rtl',
          fontSize: '22px',
          lineHeight: '2.5',
          fontFamily: '"Times New Roman", serif',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          minHeight: '300px'
        }}
      >
        {/* SVG Arcs Layout */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 5
          }}
        >
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#0056b3" />
            </marker>
          </defs>
          {arcs.map(arc => (
            <path
              key={arc.id}
              d={arc.d}
              fill="none"
              stroke="#0056b3"
              strokeWidth="2.5"
              strokeDasharray="4 3"
              markerEnd="url(#arrow)"
              style={{
                filter: 'drop-shadow(0px 2px 4px rgba(0, 86, 179, 0.35))'
              }}
            />
          ))}
        </svg>

        {/* Prose flow */}
        <div style={{ position: 'relative', zIndex: 2, display: 'inline' }}>
          {gridLetters.map((item, idx) => {
            if (item.isMatch) {
              return (
                <span
                  key={idx}
                  className="els-highlight-char"
                  style={{
                    display: 'inline-block',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    backgroundColor: '#0056b3',
                    padding: '0 4px',
                    margin: '0 2px',
                    borderRadius: '4px',
                    border: '1px solid #60a5fa',
                    boxShadow: '0 2px 6px rgba(0, 86, 179, 0.3)',
                    transform: 'scale(1.08)',
                    position: 'relative'
                  }}
                >
                  {item.char}
                </span>
              );
            }

            return (
              <span
                key={idx}
                style={{
                  color: 'rgba(52, 58, 64, 0.35)',
                  margin: '0 1px',
                  display: 'inline-block'
                }}
              >
                {item.char}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ELSLinearView;