import React, { useState, useEffect } from 'react';

function ELSFeedView({ elsData, loading, t }) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    setSelectedIdx(0);
  }, [elsData]);

  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner"></div>
        <p>{t('autoDiscovering') || "Analyzing Equidistant Letter Sequences..."}</p>
      </div>
    );
  }

  if (!elsData || !elsData.matches) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', color: '#adb5bd', padding: '0 16px' }}>
        <div
          dir="ltr"
          style={{
            fontSize: '20px',
            fontWeight: '600',
            letterSpacing: '0.3px',
            color: '#adb5bd',
            marginBottom: '8px'
          }}
        >
          OROT - Hebrew Bible Analytics Engine
        </div>
        <p style={{ fontSize: '14px', margin: 0, color: '#adb5bd' }}>
          {t('useControlPanel') || "Use the control panel to start your search."}
        </p>
      </div>
    );
  }

  const matches = elsData.matches;

  if (matches.length === 0) {
    return (
      <div className="empty-state">
        <h3>{t('noEls') || "No ELS patterns discovered"}</h3>
        <p>{t('noLetterSkip') || "No letter skip occurrences found for this term in the selected scopes."}</p>
      </div>
    );
  }

  const activeMatch = matches[selectedIdx] || matches[0];

  const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

  const handleExportElsCSV = () => {
    const BOM = '\uFEFF';
    let csvLines = [];

    if (activeMatch.isManual) {
      csvLines.push(["Start Coordinate", "Start Letter", "Jump Size (Skip)", "Jump Count", "Discovered Sequence", "Verses Context"].join(","));
      matches.forEach(m => {
        const contextStr = (m.feedNodes || []).map(n => `[${n.ref}] ${n.text}`).join(" | ");
        csvLines.push([
          escapeCsv(m.bookName),
          escapeCsv(m.startChar),
          m.skip,
          m.jumpCount,
          escapeCsv(m.term),
          escapeCsv(contextStr)
        ].join(","));
      });
    } else {
      csvLines.push(["Match #", "Search Term", "Book", "Skip", "Start Reference", "End Reference", "Verses Context"].join(","));
      matches.forEach((m, idx) => {
        const nodes = m.feedNodes || [];
        const startRef = nodes[0]?.ref || "";
        const endRef = nodes[nodes.length - 1]?.ref || "";
        const contextStr = nodes.map(n => `[${n.ref}] ${n.text}`).join(" | ");
        csvLines.push([
          idx + 1,
          escapeCsv(m.term),
          escapeCsv(m.bookName),
          m.skip,
          escapeCsv(startRef),
          escapeCsv(endRef),
          escapeCsv(contextStr)
        ].join(","));
      });
    }

    const blob = new Blob([BOM + csvLines.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = activeMatch.isManual ? "orot_els_manual.csv" : `orot_els_${activeMatch.term}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderHighlightedVerse = (text, highlights = []) => {
    const highlightSet = new Set(highlights);
    return text.split('').map((char, idx) => {
      if (highlightSet.has(idx)) {
        return (
          <span
            key={idx}
            style={{
              backgroundColor: '#4c1d95',
              color: '#ffffff',
              fontWeight: 'bold',
              borderRadius: '4px',
              padding: '0 4px',
              margin: '0 1px',
              display: 'inline-block',
              boxShadow: '0 2px 4px rgba(76, 29, 149, 0.25)'
            }}
          >
            {char === ' ' ? '␣' : char}
          </span>
        );
      }
      return <span key={idx}>{char}</span>;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header Card */}
      <div style={{ backgroundColor: '#ffffff', padding: '18px 22px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e9ecef', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {!activeMatch.isManual && matches.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setSelectedIdx(prev => (prev > 0 ? prev - 1 : matches.length - 1))}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ced4da', backgroundColor: '#f8f9fa', cursor: 'pointer', fontWeight: 'bold', color: '#4c1d95' }}
              >
                ◀
              </button>
              <button
                onClick={() => setSelectedIdx(prev => (prev < matches.length - 1 ? prev + 1 : 0))}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ced4da', backgroundColor: '#f8f9fa', cursor: 'pointer', fontWeight: 'bold', color: '#4c1d95' }}
              >
                ▶
              </button>
              <select
                value={selectedIdx}
                onChange={(e) => setSelectedIdx(Number(e.target.value))}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '13px', fontWeight: '600', color: '#343a40', backgroundColor: '#fff' }}
              >
                {matches.map((m, i) => (
                  <option key={i} value={i}>
                    #{i + 1} — Skip: {m.skip} ({m.feedNodes[0]?.ref || m.bookName})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleExportElsCSV}
            className="btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: '600',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              border: '1px solid #15803d',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>{t('csv') || "Export"}</span>
          </button>
        </div>

        <div style={{ textAlign: 'end' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#4c1d95' }}>
            {t('elsContextFeed')} "{activeMatch.term}"
          </h2>
          <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '4px' }}>
            {activeMatch.isManual ? (
              <>
                {t('start')} <strong>{activeMatch.bookName}</strong> | {t('skipPattern')} <strong>{activeMatch.skip}</strong> | {t('jumps')} <strong>{activeMatch.jumpCount}</strong>
              </>
            ) : (
              <>
                {t('book')} <strong>{activeMatch.bookName}</strong> | {t('skipPattern')} <strong>{activeMatch.skip}</strong> ({selectedIdx + 1} / {matches.length})
              </>
            )}
          </div>
        </div>
      </div>

      {/* Verse Nodes Card */}
      <div style={{ backgroundColor: '#ffffff', padding: '22px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e9ecef', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {activeMatch.feedNodes.map((node, idx) => (
          <div key={idx} style={{ paddingBottom: idx < activeMatch.feedNodes.length - 1 ? '16px' : '0', borderBottom: idx < activeMatch.feedNodes.length - 1 ? '1px dashed #dee2e6' : 'none' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#6c757d', marginBottom: '6px' }}>
              {node.ref}
            </div>
            <div dir="rtl" style={{ fontSize: '20px', lineHeight: '2', color: '#212529' }}>
              {renderHighlightedVerse(node.text, node.highlights)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ELSFeedView;