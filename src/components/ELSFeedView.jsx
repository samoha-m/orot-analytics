import React, { useState, useEffect } from 'react';

function ELSFeedView({ elsData, loading, t, lang }) {
  const isRTL = lang === 'he' || lang === 'fa';
  const [selectedIndex, setSelectedIndex] = useState(0);

  const occurrences =
    (elsData && (elsData.matches || elsData.occurrences || elsData.results)) || [];

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
    (currentOcc && currentOcc.term) ||
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
  const noMatchesLabel =
    t('noMatchesInScope') ||
    (lang === 'he'
      ? 'לא נמצאו דילוגים בטווח שנבחר.'
      : lang === 'fa'
      ? 'هیچ پرشی در محدوده انتخاب‌شده یافت نشد.'
      : 'No skip matches found in the selected scope.');

  const getOccurrenceStartRef = (occ) => {
    if (!occ) return '';
    if (Array.isArray(occ.feedNodes) && occ.feedNodes.length > 0 && occ.feedNodes[0].ref) {
      return occ.feedNodes[0].ref;
    }
    return (
      occ.ref ||
      occ.startRef ||
      [occ.bookName || occ.book, occ.chapter && occ.verse ? `${occ.chapter}:${occ.verse}` : '']
        .filter(Boolean)
        .join(' ')
    );
  };

  const formatOptionLabel = (occ, idx) => {
    const skipVal = occ.skip ?? occ.step ?? '';
    const refVal = getOccurrenceStartRef(occ);
    return `#${idx + 1} — ${skipOfLabel} ${skipVal}${refVal ? ` (${refVal})` : ''}`;
  };

  const handleExportELS = () => {
    if (!occurrences.length) return;
    const BOM = '\uFEFF';
    const header = ['#', 'Term', 'Book', 'Start Reference', 'Skip', 'Verses'].join(',');
    const rows = occurrences.map((occ, idx) => {
      const term = (occ.term || displayTerm || '').replace(/"/g, '""');
      const book = (occ.bookName || occ.book || '').replace(/"/g, '""');
      const ref = getOccurrenceStartRef(occ).replace(/"/g, '""');
      const skip = occ.skip ?? occ.step ?? '';
      const versesText = Array.isArray(occ.feedNodes)
        ? occ.feedNodes.map((n) => `${n.ref}: ${n.text}`).join(' | ')
        : occ.snippet || occ.text || '';
      return [
        idx + 1,
        `"${term}"`,
        `"${book}"`,
        `"${ref}"`,
        skip,
        `"${versesText.replace(/"/g, '""')}"`
      ].join(',');
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

  const renderHighlightedVerseText = (text = '', highlights = []) => {
    const highlightSet = new Set(highlights);
    if (highlightSet.size === 0) return text;

    // Split by UTF-16 code unit index so indices match worker.js charIndexInString 1:1
    return text.split('').map((ch, idx) =>
      highlightSet.has(idx) ? (
        <mark
          key={idx}
          className="highlight-match"
          style={{
            padding: '1px 5px',
            margin: '0 1px',
            borderRadius: '5px',
            fontWeight: '900',
            boxShadow: '0 0 10px rgba(251, 191, 36, 0.35)'
          }}
        >
          {ch}
        </mark>
      ) : (
        <React.Fragment key={idx}>{ch}</React.Fragment>
      )
    );
  };

  const renderOccurrenceContent = (occ) => {
    if (!occ) return null;

    // Primary format returned by worker.js for Automatic, Anchored, and Manual ELS
    if (Array.isArray(occ.feedNodes) && occ.feedNodes.length > 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {occ.feedNodes.map((node, idx) => (
            <div
              key={`${node.ref}-${idx}`}
              className="verse-item"
              style={{ marginBottom: 0 }}
            >
              {node.ref && <div className="verse-ref">{node.ref}</div>}
              <div className="verse-text">
                {renderHighlightedVerseText(node.text, node.highlights)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Fallback for snippet/text payloads
    const rawText = occ.snippet || occ.context || occ.text || '';
    const matchIndices = occ.matchIndices || occ.indices || [];
    if (rawText) {
      return (
        <div className="verse-item">
          <div className="verse-text">
            {renderHighlightedVerseText(rawText, matchIndices)}
          </div>
        </div>
      );
    }

    return null;
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

          {currentOcc ? (
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
          ) : (
            <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>
              {noMatchesLabel}
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
                dir={isRTL ? 'rtl' : 'ltr'}
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

      {/* Matched Verses with Highlighted ELS Skip Letters */}
      {currentOcc && renderOccurrenceContent(currentOcc)}
    </div>
  );
}

export default ELSFeedView;