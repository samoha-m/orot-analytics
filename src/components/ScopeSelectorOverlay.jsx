import React, { useState, useEffect } from 'react';
import { booksList, numberToHebrew } from '../data/constants';

function ScopeSelectorOverlay({ isOpen, onClose, ranges, setRanges, t, lang }) {
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
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 40,
        backgroundColor: visible ? 'rgba(15, 23, 42, 0.38)' : 'rgba(15, 23, 42, 0)',
        backdropFilter: visible ? 'blur(2px)' : 'none',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        padding: '16px',
        transition: 'background-color 0.22s ease, backdrop-filter 0.22s ease'
      }}
    >
      <style>{`
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
          background: #f8fafc;
        }
        .scope-chapters-pane {
          flex: 1;
          overflow-y: auto;
          padding: 18px 20px;
          background: #ffffff;
        }
        @media (max-width: 680px) {
          .scope-overlay-panes {
            flex-direction: column;
          }
          .scope-books-pane {
            width: 100%;
            max-height: 42%;
            border-bottom: 1px solid #cbd5e1;
          }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '920px',
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          boxShadow: '0 20px 45px rgba(15, 23, 42, 0.2)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(14px) scale(0.985)',
          transition: 'opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Top Action Bar */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#1e3a8a' }}>
              {t('comparisonScopes') || "Comparison Scopes"}
            </h3>
            <span
              style={{
                fontSize: '12px',
                fontWeight: '700',
                padding: '3px 10px',
                borderRadius: '999px',
                backgroundColor: totalSelectedBooks > 0 ? '#eff6ff' : '#f1f5f9',
                color: totalSelectedBooks > 0 ? '#1d4ed8' : '#64748b',
                border: totalSelectedBooks > 0 ? '1px solid #bfdbfe' : '1px solid transparent'
              }}
            >
              {renderBadgeSummary()}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleSelectAllBooks}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                color: '#1d4ed8',
                cursor: 'pointer'
              }}
            >
              {t('selectAllBooks') || "Select All Books"}
            </button>
            <button
              type="button"
              onClick={handleClearAllBooks}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                color: '#dc2626',
                cursor: 'pointer'
              }}
            >
              {t('clearAll') || "Clear All"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '6px 16px',
                fontSize: '12px',
                fontWeight: '700',
                borderRadius: '6px',
                border: '1px solid #1e3a8a',
                backgroundColor: '#1d4ed8',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              {t('done') || "Done"}
            </button>
          </div>
        </div>

        {/* Two-Pane Master-Detail Body */}
        <div className="scope-overlay-panes">
          {/* Books Master List */}
          <div
            className="scope-books-pane"
            style={{
              borderInlineEnd: '1px solid #e2e8f0'
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
                    backgroundColor: isFocused ? '#eff6ff' : 'transparent',
                    borderBottom: '1px solid #e2e8f0',
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
                      style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#1d4ed8', flexShrink: 0 }}
                    />
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: isFocused || selCount > 0 ? '600' : '400',
                        color: isFocused ? '#1e3a8a' : selCount > 0 ? '#1e293b' : '#64748b',
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
                      backgroundColor: selCount > 0 ? '#dbeafe' : '#e2e8f0',
                      color: selCount > 0 ? '#1d4ed8' : '#64748b',
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
                borderBottom: '1px dashed #cbd5e1',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <div>
                <span style={{ fontSize: '16px', fontWeight: '700', color: '#1e3a8a' }}>
                  {getBookTitle(focusedBook)}
                </span>
                <span style={{ fontSize: '13px', color: '#64748b', marginInlineStart: '8px' }}>
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
                    borderRadius: '5px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#f8fafc',
                    color: '#1d4ed8',
                    cursor: 'pointer'
                  }}
                >
                  {t('all') || "All"}
                </button>
                <button
                  type="button"
                  onClick={() => handleBookChaptersAction(focusedBook, 'none')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: '600',
                    borderRadius: '5px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#f8fafc',
                    color: '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  {t('none') || "None"}
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
      </div>
    </div>
  );
}

export default ScopeSelectorOverlay;