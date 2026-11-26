import React, { useState, useEffect } from 'react';

function ELSFeedView({ elsData, loading, t, lang }) {
  const isRTL = lang === 'he' || lang === 'fa';
  const [selectedIndex, setSelectedIndex] = useState(0);

  const occurrences =
    (elsData && (elsData.occurrences || elsData.results || elsData.matches)) || [];

  useEffect(() => {
    setSelectedIndex(0);
  }, [elsData]);

  if (loading || !elsData) {
    return null;
  }

  const safeIndex =
    occurrences.length > 0 ? Math.min(selectedIndex, occurrences.length - 1) : 0;
  const currentOcc = occurrences[safeIndex] || null;

  const displayTerm =
    elsData.term ||
    (Array.isArray(elsData.terms) ? elsData.terms.join(', ') : elsData.query || '');

  const showingLabel =
    lang === 'he'
      ? 'מציג דילוגים:'
      : lang === 'fa'
      ? 'نمایش پرش‌ها:'
      : 'Showing skips:';

  const bookLabel = lang === 'he' ? 'ספר:' : lang === 'fa' ? 'کتاب:' : 'Book:';
  const skipOfLabel =
    lang === 'he' ? 'דילוג של:' : lang === 'fa' ? 'پرش:' : 'Skip of:';

  const formatOptionLabel = (occ, idx) => {
    const skipVal = occ.skip ?? occ.step ?? '';
    const refVal =
      occ.ref ||
      occ.startRef ||
      [occ.bookName || occ.book, occ.chapter && occ.verse ? `${occ.chapter}:${occ.verse}` : '']
        .filter(Boolean)
        .join(' ');
    return `#${idx + 1} — ${skipOfLabel} ${skipVal}${refVal ? ` (${refVal})` : ''}`;
  };

  const handleExportELS = () => {
    if (!occurrences.length) return;
    const BOM = '\uFEFF';
    const header = ['#', 'Term', 'Book', 'Reference', 'Skip', 'Snippet'].join(',');
    const rows = occurrences.map((occ, idx) => {
      const book = occ.bookName || occ.book || '';
      const ref = occ.ref || occ.startRef || '';
      const skip = occ.skip ?? occ.step ?? '';
      const snippet = (occ.snippet || occ.text || '').replace(/"/g, '""');
      return [idx + 1, `"${displayTerm}"`, `"${book}"`, `"${ref}"`, skip, `"${snippet}"`].join(',');
    });
    const blob = new Blob([BOM + [header, ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8;'
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'orot_els_skips.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render highlighted ELS letters / matrix / context snippet
  const renderOccurrenceContent = (occ) => {
    if (!occ) return null;

    // Case A: Array of character cells ({ char, isMatch, isAnchor, ref })
    if (Array.isArray(occ.letters) && occ.letters.length > 0) {
      return (
        <div
          dir="rtl"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '6px',
            padding: '16px 12px',
            backgroundColor: 'rgba(9, 14, 26, 0.9)',
            borderRadius: '12px',
            border: '1px solid rgba(51, 65, 85, 0.7)'
          }}
        >
          {occ.letters.map((cell, idx) => {
            const ch = typeof cell === 'string' ? cell : cell.char;
            const isMatch = typeof cell === 'object' && Boolean(cell.isMatch);
            const isAnchor = typeof cell === 'object' && Boolean(cell.isAnchor);

            return (
              <span
                key={idx}
                title={typeof cell === 'object' ? cell.ref || '' : ''}
                style={{
                  width: '32px',
                  height: '34px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '7px',
                  fontSize: '18px',
                  fontWeight: isMatch ? '900' : '600',
                  fontFamily: '"Times New Roman", serif',
                  backgroundColor: isAnchor
                    ? 'rgba(56, 189, 248, 0.25)'
                    : isMatch
                    ? 'rgba(251, 191, 36, 0.24)'
                    : 'rgba(15, 23, 42, 0.85)',
                  border: isAnchor
                    ? '1.5px solid #38bdf8'
                    : isMatch
                    ? '1.5px solid #fbbf24'
                    : '1px solid rgba(51, 65, 85, 0.5)',
                  color: isAnchor ? '#7dd3fc' : isMatch ? '#fde68a' : '#cbd5e1',
                  boxShadow: isMatch ? '0 0 10px rgba(251, 191, 36, 0.28)' : 'none'
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
      );
    }

    // Case B: Context text with matchIndices array
    const rawText = occ.snippet || occ.context || occ.text || '';
    const matchSet = new Set(occ.matchIndices || occ.indices || []);

    if (rawText && matchSet.size > 0) {
      return (
        <div
          dir="rtl"
          style={{
            padding: '16px',
            backgroundColor: 'rgba(9, 14, 26, 0.9)',
            borderRadius: '12px',
            border: '1px solid rgba(51, 65, 85, 0.7)',
            fontSize: '20px',
            lineHeight: '2',
            fontFamily: '"Times New Roman", serif',
            color: '#e2e8f0',
            wordBreak: 'break-word'
          }}
        >
          {Array.from(rawText).map((ch, idx) =>
            matchSet.has(idx) ? (
              <span
                key={idx}
                className="highlight-match"
                style={{ padding: '1px 4px', margin: '0 1px' }}
              >
                {ch}
              </span>
            ) : (
              <React.Fragment key={idx}>{ch}</React.Fragment>
            )
          )}
        </div>
      );
    }

    // Case C: Verses array inside the occurrence
    if (Array.isArray(occ.verses) && occ.verses.length > 0) {
      return occ.verses.map((v, idx) => (
        <div key={idx} className="verse-item">
          {v.ref && <div className="verse-ref">{v.ref}</div>}
          <div className="verse-text">{v.text}</div>
        </div>
      ));
    }

    return rawText ? (
      <div className="verse-item">
        <div className="verse-text">{rawText}</div>
      </div>
    ) : null;
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      {/* Header & Navigation Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '16px',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            textAlign: isRTL ? 'right' : 'left'
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 'clamp(17px, 2.5vw, 22px)',
              fontWeight: '800',
              color: '#f1f5f9',
              wordBreak: 'break-word'
            }}
          >
            {showingLabel}{' '}
            {displayTerm && <span style={{ color: '#7dd3fc' }}>"{displayTerm}"</span>}
          </h2>

          {currentOcc && (
            <div
              style={{
                fontSize: '13px',
                color: '#94a3b8',
                fontWeight: '600',
                lineHeight: '1.5'
              }}
            >
              {bookLabel}{' '}
              <strong style={{ color: '#e2e8f0' }}>
                {currentOcc.bookName || currentOcc.book || ''}
              </strong>{' '}
              | {skipOfLabel}{' '}
              <strong style={{ color: '#fbbf24' }}>
                {currentOcc.skip ?? currentOcc.step ?? ''}
              </strong>{' '}
              ({safeIndex + 1} / {occurrences.length})
            </div>
          )}
        </div>

        {/* Responsive Control Bar (Constrained to fit mobile screens cleanly) */}
        {occurrences.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              maxWidth: '100%',
              marginTop: '14px'
            }}
          >
            {/* Prev / Next Navigation Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() =>
                  setSelectedIndex((prev) =>
                    prev > 0 ? prev - 1 : occurrences.length - 1
                  )
                }
                aria-label="Previous occurrence"
                style={{
                  width: '38px',
                  height: '38px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '9px',
                  border: '1px solid rgba(51, 65, 85, 0.9)',
                  backgroundColor: '#090e1a',
                  color: '#7dd3fc',
                  cursor: 'pointer'
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points={isRTL ? '9 18 15 12 9 6' : '15 18 9 12 15 6'} />
                </svg>
              </button>

              <button
                type="button"
                onClick={() =>
                  setSelectedIndex((prev) =>
                    prev < occurrences.length - 1 ? prev + 1 : 0
                  )
                }
                aria-label="Next occurrence"
                style={{
                  width: '38px',
                  height: '38px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '9px',
                  border: '1px solid rgba(51, 65, 85, 0.9)',
                  backgroundColor: '#090e1a',
                  color: '#7dd3fc',
                  cursor: 'pointer'
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points={isRTL ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
                </svg>
              </button>
            </div>

            {/* Occurrence Dropdown — minWidth: 0 + textOverflow prevents horizontal overflow */}
            <div style={{ flex: '1 1 170px', minWidth: 0, maxWidth: '100%' }}>
              <select
                value={safeIndex}
                onChange={(e) => setSelectedIndex(Number(e.target.value))}
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                  height: '38px',
                  padding: '0 10px',
                  borderRadius: '9px',
                  border: '1px solid rgba(56, 189, 248, 0.45)',
                  backgroundColor: '#090e1a',
                  color: '#f1f5f9',
                  fontSize: '13px',
                  fontWeight: '700',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  boxSizing: 'border-box',
                  cursor: 'pointer'
                }}
              >
                {occurrences.map((occ, idx) => (
                  <option key={idx} value={idx}>
                    {formatOptionLabel(occ, idx)}
                  </option>
                ))}
              </select>
            </div>

            {/* CSV Export Button */}
            <button
              type="button"
              onClick={handleExportELS}
              title={t('exportCSV') || 'Export CSV'}
              aria-label={t('exportCSV') || 'Export CSV'}
              style={{
                width: '38px',
                height: '38px',
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '9px',
                border: '1px solid rgba(56, 189, 248, 0.55)',
                background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
                color: '#ffffff',
                boxShadow: '0 0 12px rgba(56, 189, 248, 0.3)',
                cursor: 'pointer'
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Active Occurrence Matrix / Highlighted Context */}
      {currentOcc && renderOccurrenceContent(currentOcc)}
    </div>
  );
}

export default ELSFeedView;