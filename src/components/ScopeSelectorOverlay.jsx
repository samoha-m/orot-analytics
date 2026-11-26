import React, { useState, useEffect } from 'react';
import { booksList, numberToHebrew } from '../data/constants';

function ScopeSelectorOverlay({ isOpen, onClose, ranges, setRanges, t, lang }) {
  const isRTL = lang === 'he' || lang === 'fa';
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [visible, setVisible] = useState(false);
  const [focusedBookId, setFocusedBookId] = useState(() => ranges[0]?.bookId || booksList[0]?.id || '01');

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      if (ranges.length > 0 && !ranges.some(r => r.bookId === focusedBookId)) {
        setFocusedBookId(ranges[0].bookId);
      }
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 220);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const getBookTitle = (book) => {
    if (lang === 'he') return book.he;
    if (lang === 'fa') return book.fa;
    return book.name.replace('_', ' ');
  };

  const sortRangesCanonical = (list) => {
    const orderMap = new Map(booksList.map((b, idx) => [b.id, idx]));
    return [...list].sort((a, b) => (orderMap.get(a.bookId) ?? 0) - (orderMap.get(b.bookId) ?? 0));
  };

  const handleSelectAllBooks = () => {
    const allRanges = booksList.map((b, idx) => ({
      id: `${b.id}-${idx}`,
      bookId: b.id,
      selectedChapters: Array.from({ length: b.maxCh }, (_, i) => i + 1),
      isExpanded: false
    }));
    setRanges(allRanges);
  };

  const handleClearAllBooks = () => {
    setRanges([]);
  };

  const toggleWholeBook = (book) => {
    setFocusedBookId(book.id);
    const existing = ranges.find(r => r.bookId === book.id);
    if (existing && existing.selectedChapters.length === book.maxCh) {
      setRanges(ranges.filter(r => r.bookId !== book.id));
    } else {
      const fullChapters = Array.from({ length: book.maxCh }, (_, i) => i + 1);
      if (existing) {
        setRanges(ranges.map(r => (r.bookId === book.id ? { ...r, selectedChapters: fullChapters } : r)));
      } else {
        setRanges(sortRangesCanonical([...ranges, { id: `${book.id}-${Date.now()}`, bookId: book.id, selectedChapters: fullChapters, isExpanded: false }]));
      }
    }
  };

  const handleBookChaptersAction = (book, action, singleCh = null) => {
    const existing = ranges.find(r => r.bookId === book.id);
    let nextChapters = existing ? [...existing.selectedChapters] : [];

    if (action === 'all') {
      nextChapters = Array.from({ length: book.maxCh }, (_, i) => i + 1);
    } else if (action === 'none') {
      nextChapters = [];
    } else if (action === 'toggle' && singleCh !== null) {
      if (nextChapters.includes(singleCh)) {
        nextChapters = nextChapters.filter(c => c !== singleCh);
      } else {
        nextChapters = [...nextChapters, singleCh].sort((a, b) => a - b);
      }
    }

    if (nextChapters.length === 0) {
      setRanges(ranges.filter(r => r.bookId !== book.id));
    } else if (existing) {
      setRanges(ranges.map(r => (r.bookId === book.id ? { ...r, selectedChapters: nextChapters } : r)));
    } else {
      setRanges(sortRangesCanonical([...ranges, { id: `${book.id}-${Date.now()}`, bookId: book.id, selectedChapters: nextChapters, isExpanded: false }]));
    }
  };

  const focusedBook = booksList.find(b => b.id === focusedBookId) || booksList[0];
  const focusedRange = ranges.find(r => r.bookId === focusedBook.id);
  const focusedSelectedChapters = focusedRange ? focusedRange.selectedChapters : [];

  const totalSelectedBooks = ranges.filter(r => r.selectedChapters.length > 0).length;
  const totalSelectedChapters = ranges.reduce((sum, r) => sum + r.selectedChapters.length, 0);

  const renderBadgeSummary = () => {
    if (totalSelectedBooks === 0) {
      return t('noBooksSelected') !== 'noBooksSelected' ? t('noBooksSelected') : 'No books selected';
    }
    if (totalSelectedBooks === booksList.length) {
      const fn = t('allBooksSummary');
      return typeof fn === 'function' ? fn(totalSelectedBooks, totalSelectedChapters) : `All Books (${totalSelectedBooks}) · ${totalSelectedChapters} Chs`;
    }
    const fn = t('multiBooksSummary');
    return typeof fn === 'function' ? fn(totalSelectedBooks, totalSelectedChapters) : `${totalSelectedBooks} Books · ${totalSelectedChapters} Chs`;
  };

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={onClose}
      className="scope-overlay-backdrop"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 40,
        backgroundColor: visible ? 'rgba(4, 7, 15, 0.76)' : 'rgba(4, 7, 15, 0)',
        backdropFilter: visible ? 'blur(6px)' : 'none',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        padding: '16px',
        transition: 'background-color 0.22s ease, backdrop-filter 0.22s ease'
      }}
    >
      <style>{`
        .scope-overlay-header {
          padding: 14px 20px;
          border-bottom: 1px solid rgba(30, 41, 59, 0.95);
          background-color: #0c1220;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .scope-header-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .scope-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .scope-overlay-panes {
          display: flex;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }
        .scope-books-pane {
          width: 260px;
          flex-shrink: 0;
          overflow-y: auto;
          background: #090e1a;
        }
        .scope-chapters-pane {
          flex: 1;
          overflow-y: auto;
          padding: 18px 20px;
          background: #0d1424;
        }
        .scope-mobile-footer {
          display: none;
        }
        @media (max-width: 680px) {
          .scope-overlay-backdrop {
            padding: 8px !important;
          }
          .scope-overlay-header {
            padding: 12px 14px;
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
          .scope-header-title-row {
            width: 100%;
          }
          .scope-header-actions {
            width: 100%;
            justify-content: flex-start;
          }
          .scope-header-actions .scope-top-done-btn {
            display: none !important;
          }
          .scope-overlay-panes {
            flex-direction: column;
          }
          .scope-books-pane {
            width: 100%;
            max-height: 38%;
            border-bottom: 1px solid rgba(51, 65, 85, 0.85);
          }
          .scope-chapters-pane {
            padding: 14px 14px 20px 14px;
          }
          .scope-mobile-footer {
            display: flex;
            flex-shrink: 0;
            padding: 10px 14px calc(10px + env(safe-area-inset-bottom, 0px)) 14px;
            background: linear-gradient(180deg, rgba(12, 18, 32, 0.96) 0%, #080c16 100%);
            border-top: 1px solid rgba(56, 189, 248, 0.4);
            box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.55);
            z-index: 10;
          }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '920px',
          backgroundColor: '#0d1424',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(14px) scale(0.985)',
          transition: 'opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Top Action Bar */}
        <div className="scope-overlay-header">
          <div className="scope-header-title-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#f1f5f9', fontWeight: '700' }}>
                {t('comparisonScopes') || 'Comparison Scopes'}
              </h3>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  backgroundColor: totalSelectedBooks > 0 ? 'rgba(56, 189, 248, 0.16)' : '#1e293b',
                  color: totalSelectedBooks > 0 ? '#7dd3fc' : '#94a3b8',
                  border: totalSelectedBooks > 0 ? '1px solid rgba(56, 189, 248, 0.45)' : '1px solid transparent'
                }}
              >
                {renderBadgeSummary()}
              </span>
            </div>
          </div>

          <div className="scope-header-actions">
            <button
              type="button"
              onClick={handleSelectAllBooks}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: '7px',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                backgroundColor: '#0f172a',
                color: '#7dd3fc',
                cursor: 'pointer'
              }}
            >
              {t('selectAllBooks') || 'Select All Books'}
            </button>
            <button
              type="button"
              onClick={handleClearAllBooks}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: '7px',
                border: '1px solid rgba(251, 113, 133, 0.4)',
                backgroundColor: '#0f172a',
                color: '#fda4af',
                cursor: 'pointer'
              }}
            >
              {t('clearAll') || 'Clear All'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="scope-top-done-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 18px',
                fontSize: '13px',
                fontWeight: '800',
                borderRadius: '8px',
                border: '1px solid rgba(125, 211, 252, 0.8)',
                background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
                color: '#ffffff',
                boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)',
                cursor: 'pointer'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{t('done') || 'Done'}</span>
            </button>
          </div>
        </div>

        {/* Two-Pane Master-Detail Body */}
        <div className="scope-overlay-panes">
          {/* Books Master List */}
          <div
            className="scope-books-pane"
            style={{
              borderInlineEnd: '1px solid rgba(30, 41, 59, 0.95)'
            }}
          >
            {booksList.map((book) => {
              const rangeEntry = ranges.find(r => r.bookId === book.id);
              const selCount = rangeEntry ? rangeEntry.selectedChapters.length : 0;
              const isAll = selCount === book.maxCh;
              const isPartial = selCount > 0 && selCount < book.maxCh;
              const isFocused = focusedBook.id === book.id;

              return (
                <div
                  key={book.id}
                  onClick={() => setFocusedBookId(book.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 14px',
                    cursor: 'pointer',
                    backgroundColor: isFocused ? 'rgba(56, 189, 248, 0.14)' : 'transparent',
                    borderBottom: '1px solid rgba(30, 41, 59, 0.7)',
                    transition: 'background-color 0.12s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                    <input
                      type="checkbox"
                      checked={isAll}
                      ref={(el) => {
                        if (el) el.indeterminate = isPartial;
                      }}
                      onChange={() => toggleWholeBook(book)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#38bdf8', flexShrink: 0 }}
                    />
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: isFocused || selCount > 0 ? '600' : '400',
                        color: isFocused ? '#7dd3fc' : selCount > 0 ? '#f1f5f9' : '#94a3b8',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {getBookTitle(book)}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 7px',
                      borderRadius: '10px',
                      backgroundColor: selCount > 0 ? 'rgba(56, 189, 248, 0.18)' : '#1e293b',
                      color: selCount > 0 ? '#7dd3fc' : '#64748b',
                      flexShrink: 0
                    }}
                  >
                    {selCount}/{book.maxCh}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Chapters Detail Grid */}
          <div className="scope-chapters-pane">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '12px',
                marginBottom: '14px',
                borderBottom: '1px dashed rgba(51, 65, 85, 0.85)',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <div>
                <span style={{ fontSize: '16px', fontWeight: '700', color: '#7dd3fc' }}>
                  {getBookTitle(focusedBook)}
                </span>
                <span style={{ fontSize: '13px', color: '#94a3b8', marginInlineStart: '8px' }}>
                  ({focusedSelectedChapters.length}/{focusedBook.maxCh} {t('chapters')})
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleBookChaptersAction(focusedBook, 'all')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: '600',
                    borderRadius: '6px',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    backgroundColor: '#0f172a',
                    color: '#7dd3fc',
                    cursor: 'pointer'
                  }}
                >
                  {t('all') || 'All'}
                </button>
                <button
                  type="button"
                  onClick={() => handleBookChaptersAction(focusedBook, 'none')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: '600',
                    borderRadius: '6px',
                    border: '1px solid rgba(51, 65, 85, 0.85)',
                    backgroundColor: '#0f172a',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  {t('none') || 'None'}
                </button>
              </div>
            </div>

            <div className="chapter-grid">
              {Array.from({ length: focusedBook.maxCh }, (_, i) => i + 1).map((ch) => {
                const isSelected = focusedSelectedChapters.includes(ch);
                return (
                  <button
                    type="button"
                    key={ch}
                    className={`chapter-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleBookChaptersAction(focusedBook, 'toggle', ch)}
                  >
                    {numberToHebrew(ch)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky High-Visibility Mobile Bottom "Done" Footer */}
        <div className="scope-mobile-footer">
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              height: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              borderRadius: '12px',
              border: '1.5px solid rgba(125, 211, 252, 0.9)',
              background: 'linear-gradient(90deg, #2563eb 0%, #0284c7 50%, #0ea5e9 100%)',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '800',
              letterSpacing: '0.01em',
              boxShadow: '0 0 24px rgba(56, 189, 248, 0.5), 0 6px 16px rgba(0, 0, 0, 0.45)',
              cursor: 'pointer'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{t('done') || 'Done'}</span>
            <span
              style={{
                fontSize: '12px',
                fontWeight: '700',
                padding: '2px 9px',
                borderRadius: '999px',
                backgroundColor: 'rgba(7, 11, 20, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#e0f2fe'
              }}
            >
              {renderBadgeSummary()}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ScopeSelectorOverlay;