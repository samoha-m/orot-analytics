import React, { useState, useEffect } from 'react';
import HebrewMatrixLoader from './HebrewMatrixLoader';

function ELSFeedView({ elsData, loading, t, lang }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const isRTL = lang === 'he' || lang === 'fa';

  useEffect(() => {
    setSelectedIdx(0);
  }, [elsData]);

  if (loading) {
    return <HebrewMatrixLoader message={t('autoDiscovering') || "Scanning letter skip sequences..."} />;
  }

  if (!elsData || !elsData.matches) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', color: '#94a3b8', padding: '0 16px' }}>
        <div
          dir="ltr"
          style={{
            fontSize: '20px',
            fontWeight: '700',
            letterSpacing: '0.3px',
            color: '#94a3b8',
            marginBottom: '8px'
          }}
        >
          OROT - Hebrew Bible Analytics Engine
        </div>
        <p style={{ fontSize: '14px', margin: 0, color: '#94a3b8' }}>
          {t('useControlPanel') || "Use the control panel to start your search."}
        </p>
      </div>
    );
  }

  const matches = elsData.matches;

  if (matches.length === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '80px', color: '#64748b', padding: '0 16px' }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#1e3a8a' }}>{t('noEls') || "No letter skip patterns discovered"}</h3>
        <p style={{ margin: 0, fontSize: '14px' }}>{t('noLetterSkip') || "No letter skip occurrences found for this term in the selected scopes."}</p>
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
    link.download = activeMatch.isManual ? "orot_skip_manual.csv" : `orot_skip_${activeMatch.term}.csv`;
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
              backgroundColor: '#1d4ed8',
              color: '#ffffff',
              fontWeight: 'bold',
              borderRadius: '4px',
              padding: '0 5px',
              margin: '0 1px',
              display: 'inline-block',
              borderBottom: '2px solid #f59e0b',
              boxShadow: '0 2px 5px rgba(29, 78, 216, 0.28)'
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
      {/* Header Card (Title Aligned to Language Reading Direction) */}
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        style={{
          backgroundColor: '#ffffff',
          padding: '16px 20px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        {/* Title Block (Right-aligned in Hebrew/Farsi, Left-aligned in English) */}
        <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
          <h2 style={{ margin: 0, fontSize: '19px', color: '#1e3a8a' }}>
            {t('elsContextFeed')} "{activeMatch.term}"
          </h2>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            {activeMatch.isManual ? (
              <>
                {t('start')} <strong style={{ color: '#1e293b' }}>{activeMatch.bookName}</strong> | {t('skipPattern')} <strong style={{ color: '#d97706' }}>{activeMatch.skip}</strong> | {t('jumps')} <strong style={{ color: '#1e293b' }}>{activeMatch.jumpCount}</strong>
              </>
            ) : (
              <>
                {t('book')} <strong style={{ color: '#1e293b' }}>{activeMatch.bookName}</strong> | {t('skipPattern')} <strong style={{ color: '#d97706' }}>{activeMatch.skip}</strong> ({selectedIdx + 1} / {matches.length})
              </>
            )}
          </div>
        </div>

        {/* Navigation & Icon-Only Download Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {!activeMatch.isManual && matches.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                aria-label="Previous match"
                onClick={() => setSelectedIdx(prev => (prev > 0 ? prev - 1 : matches.length - 1))}
                style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', cursor: 'pointer', color: '#1e3a8a' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }}>
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Next match"
                onClick={() => setSelectedIdx(prev => (prev < matches.length - 1 ? prev + 1 : 0))}
                style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', cursor: 'pointer', color: '#1e3a8a' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
              <select
                value={selectedIdx}
                onChange={(e) => setSelectedIdx(Number(e.target.value))}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600', color: '#1e293b', backgroundColor: '#ffffff' }}
              >
                {matches.map((m, i) => (
                  <option key={i} value={i}>
                    #{i + 1} — {t('skipPattern')} {m.skip} ({m.feedNodes[0]?.ref || m.bookName})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={handleExportElsCSV}
            aria-label={t('csv') || "Download CSV"}
            title={t('csv') || "Download CSV"}
            style={{
              width: '34px',
              height: '34px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1d4ed8',
              color: '#ffffff',
              border: '1px solid #1e3a8a',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(29, 78, 216, 0.25)',
              flexShrink: 0
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Verse Nodes Card */}
      <div style={{ backgroundColor: '#ffffff', padding: '22px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {activeMatch.feedNodes.map((node, idx) => (
          <div key={idx} style={{ paddingBottom: idx < activeMatch.feedNodes.length - 1 ? '16px' : '0', borderBottom: idx < activeMatch.feedNodes.length - 1 ? '1px dashed #cbd5e1' : 'none' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>
              {node.ref}
            </div>
            <div dir="rtl" style={{ fontSize: '20px', lineHeight: '2.1', color: '#0f172a', fontFamily: '"Times New Roman", serif' }}>
              {renderHighlightedVerse(node.text, node.highlights)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ELSFeedView;