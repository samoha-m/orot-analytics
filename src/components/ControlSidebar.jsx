import React, { useState, useEffect } from 'react';
import { booksList } from '../data/constants';

function ControlSidebar({
  mobileView,
  searchTerm, setSearchTerm,
  searchMode, setSearchMode,
  acronymPosition, setAcronymPosition,
  ranges, loading,
  isScopeOpen, onOpenScope, onCloseScope,
  handleSearch,
  t, lang,
  elsSubMode, setElsSubMode, manualConfig, setManualConfig,
  includeSpaces, setIncludeSpaces,
  anchorConfig, setAnchorConfig
}) {
  const isRTL = lang === 'he' || lang === 'fa';
  const sectionLabelStyle = {
    display: 'block',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#94a3b8',
    fontWeight: '700',
    marginBottom: '8px'
  };

  const [manualData, setManualData] = useState([]);
  const [verseText, setVerseText] = useState('');
  const [anchorVerseText, setAnchorVerseText] = useState('');
  const [chaptersInBook, setChaptersInBook] = useState(50);
  const [anchorChaptersInBook, setAnchorChaptersInBook] = useState(50);
  const [versesInChapter, setVersesInChapter] = useState([]);
  const [anchorVersesInChapter, setAnchorVersesInChapter] = useState([]);

  const currentGroup = ['exact', 'root', 'letter', 'acronym'].includes(searchMode) ? 'text' : searchMode;
  const isManualSkipMode = searchMode === 'els' && elsSubMode === 'manual';
  const showComparisonScopes = !(searchMode === 'els' && (elsSubMode === 'manual' || elsSubMode === 'anchor'));
  const hasInlineRunButton = !isManualSkipMode;

  const getInputPlaceholder = () => {
    if (searchMode === 'els') return t('placeholderEls');
    if (searchMode === 'gematria') return t('placeholderGematria');
    if (searchMode === 'acronym') return t('placeholderAcronym');
    return t('placeholderText');
  };

  const getBookLabel = (book) => {
    if (lang === 'he') return book.he;
    if (lang === 'fa') return book.fa;
    return book.name.replace('_', ' ');
  };

  const getScopeSummary = () => {
    const activeRanges = (ranges || []).filter(r => r.selectedChapters.length > 0);
    if (activeRanges.length === 0) {
      return t('noBooksSelected') !== 'noBooksSelected' ? t('noBooksSelected') : 'No books selected';
    }
    if (activeRanges.length === 1) {
      const r = activeRanges[0];
      const book = booksList.find(b => b.id === r.bookId);
      const bookName = book ? getBookLabel(book) : '';
      const maxCh = book?.maxCh || r.selectedChapters.length;
      const fn = t('singleBookSummary');
      return typeof fn === 'function' ? fn(bookName, r.selectedChapters.length, maxCh) : `${bookName} (${r.selectedChapters.length}/${maxCh})`;
    }
    const totalChs = activeRanges.reduce((sum, r) => sum + r.selectedChapters.length, 0);
    if (activeRanges.length === booksList.length) {
      const fn = t('allBooksSummary');
      return typeof fn === 'function' ? fn(activeRanges.length, totalChs) : `All Books (${activeRanges.length}) · ${totalChs} Chs`;
    }
    const fn = t('multiBooksSummary');
    return typeof fn === 'function' ? fn(activeRanges.length, totalChs) : `${activeRanges.length} Books · ${totalChs} Chs`;
  };

  const handleAcronymToggle = (nextPos) => {
    if (nextPos === acronymPosition) return;
    setAcronymPosition(nextPos);
    if (searchTerm.trim().length > 0 && !loading) {
      handleSearch({ acronymPosition: nextPos });
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!loading) handleSearch();
    }
  };

  // Manual Explorer Data Fetcher
  useEffect(() => {
    if (searchMode === 'els' && elsSubMode === 'manual') {
      const bookInfo = booksList.find(b => b.id === manualConfig.bookId);
      fetch(`/data/${bookInfo.id}_${bookInfo.name.toLowerCase()}.json`)
        .then(res => res.json())
        .then(data => {
          setManualData(data);
          const maxCh = Math.max(...data.map(d => d.c));
          setChaptersInBook(maxCh);
          const vList = [...new Set(data.filter(d => d.c === manualConfig.chapter).map(d => d.v))];
          setVersesInChapter(vList);
        });
    }
  }, [manualConfig.bookId, searchMode, elsSubMode]);

  useEffect(() => {
    if (manualData.length > 0) {
      const vList = [...new Set(manualData.filter(d => d.c === manualConfig.chapter).map(d => d.v))];
      setVersesInChapter(vList);
      const words = manualData.filter(d => d.c === manualConfig.chapter && d.v === manualConfig.verse).map(d => d.w);
      setVerseText(words.join(' '));
      if (words.length === 0 && vList.length > 0) {
        setManualConfig({ ...manualConfig, verse: vList[0], letterIdx: null });
      }
    }
  }, [manualConfig.chapter, manualConfig.verse, manualData, manualConfig, setManualConfig]);

  // Anchored Search Data Fetcher
  useEffect(() => {
    if (searchMode === 'els' && elsSubMode === 'anchor') {
      const bookInfo = booksList.find(b => b.id === anchorConfig.bookId);
      fetch(`/data/${bookInfo.id}_${bookInfo.name.toLowerCase()}.json`)
        .then(res => res.json())
        .then(data => {
          const maxCh = Math.max(...data.map(d => d.c));
          setAnchorChaptersInBook(maxCh);
          const vList = [...new Set(data.filter(d => d.c === anchorConfig.chapter).map(d => d.v))];
          setAnchorVersesInChapter(vList);
          const words = data.filter(d => d.c === anchorConfig.chapter && d.v === anchorConfig.verse).map(d => d.w);
          setAnchorVerseText(words.join(' '));
          if (words.length === 0 && vList.length > 0) {
            setAnchorConfig({ ...anchorConfig, verse: vList[0], letterIdx: null });
          }
        });
    }
  }, [anchorConfig.bookId, anchorConfig.chapter, anchorConfig.verse, searchMode, elsSubMode]);

  const renderPickerVerse = (text, currentIdx, onSelect) => {
    let letterCounter = 0;
    return text.split('').map((char, idx) => {
      if (/[\u0590-\u05FF]/.test(char)) {
        const currentLetterIdx = letterCounter++;
        const isSelected = currentIdx === currentLetterIdx;
        return (
          <span
            key={idx}
            onClick={() => onSelect(currentLetterIdx)}
            style={{
              cursor: 'pointer',
              backgroundColor: isSelected ? '#0284c7' : 'transparent',
              color: isSelected ? '#ffffff' : 'inherit',
              boxShadow: isSelected ? '0 0 10px rgba(56, 189, 248, 0.65)' : 'none',
              borderRadius: '5px',
              padding: '0 4px',
              display: 'inline-block',
              transform: isSelected ? 'scale(1.18)' : 'none',
              fontWeight: isSelected ? '700' : 'normal',
              transition: 'all 0.1s'
            }}
          >
            {char}
          </span>
        );
      }
      return <span key={idx}>{char}</span>;
    });
  };

  const singleRowSelectStyle = {
    width: '100%',
    minWidth: 0,
    height: '36px',
    padding: '6px 5px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#f1f5f9',
    backgroundColor: '#090e1a',
    borderRadius: '8px',
    border: '1px solid rgba(51, 65, 85, 0.85)',
    boxSizing: 'border-box',
    textOverflow: 'ellipsis'
  };

  return (
    <aside
      className={`control-sidebar ${mobileView === 'search' ? 'mobile-active' : 'mobile-hidden'}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
        borderLeft: lang === 'en' ? '1px solid rgba(30, 41, 59, 0.95)' : 'none',
        borderRight: lang !== 'en' ? '1px solid rgba(30, 41, 59, 0.95)' : 'none'
      }}
    >
      {/* Scrollable Upper Container */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 18px 10px 18px' }}>
          {/* Primary Engine Tabs */}
          <div
            style={{
              display: 'flex',
              borderRadius: '12px',
              border: '1px solid rgba(30, 41, 59, 0.95)',
              padding: '4px',
              gap: '4px',
              backgroundColor: '#080d18'
            }}
          >
            {[
              { id: 'text', label: t('textSearch') || 'Text Search', active: currentGroup === 'text', onClick: () => { if (currentGroup !== 'text') setSearchMode('exact'); } },
              { id: 'gematria', label: t('gematria') || 'Gematria', active: currentGroup === 'gematria', onClick: () => setSearchMode('gematria') },
              { id: 'els', label: t('els') || 'Skip', active: currentGroup === 'els', onClick: () => setSearchMode('els') }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={tab.onClick}
                style={{
                  flex: 1,
                  border: tab.active ? '1px solid rgba(56, 189, 248, 0.65)' : '1px solid transparent',
                  borderRadius: '8px',
                  padding: '8px 4px',
                  fontSize: '12px',
                  fontWeight: tab.active ? '700' : '500',
                  background: tab.active ? 'linear-gradient(90deg, #2563eb 0%, #4f46e5 100%)' : 'transparent',
                  color: tab.active ? '#ffffff' : '#94a3b8',
                  boxShadow: tab.active ? '0 0 14px -1px rgba(56, 189, 248, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.2)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 4-Pill Text Sub-Mode Switcher */}
          {currentGroup === 'text' && (
            <div
              style={{
                display: 'flex',
                marginTop: '12px',
                backgroundColor: 'rgba(8, 13, 24, 0.92)',
                borderRadius: '11px',
                padding: '4px',
                gap: '3px',
                border: '1px solid rgba(30, 41, 59, 0.9)'
              }}
            >
              {[
                { val: 'exact', lbl: t('exact') || 'Exact' },
                { val: 'root', lbl: t('root') || 'Root' },
                { val: 'letter', lbl: t('letter') || 'Letter' },
                { val: 'acronym', lbl: t('acronym') || 'Acronym' }
              ].map((m) => {
                const isActive = searchMode === m.val;
                return (
                  <button
                    type="button"
                    key={m.val}
                    onClick={() => setSearchMode(m.val)}
                    style={{
                      flex: m.val === 'acronym' ? 1.25 : 1,
                      border: isActive ? '1px solid rgba(56, 189, 248, 0.65)' : '1px solid transparent',
                      background: isActive ? '#162238' : 'transparent',
                      borderRadius: '8px',
                      padding: '6px 3px',
                      fontSize: '11px',
                      fontWeight: isActive ? '700' : '500',
                      color: isActive ? '#7dd3fc' : '#94a3b8',
                      boxShadow: isActive ? '0 0 12px rgba(56, 189, 248, 0.28)' : 'none',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    {m.lbl}
                  </button>
                );
              })}
            </div>
          )}

          {/* 3-Way Skip Sub-Mode Switcher */}
          {currentGroup === 'els' && (
            <div
              style={{
                display: 'flex',
                marginTop: '12px',
                backgroundColor: 'rgba(8, 13, 24, 0.92)',
                borderRadius: '11px',
                padding: '4px',
                gap: '3px',
                border: '1px solid rgba(30, 41, 59, 0.9)'
              }}
            >
              {[
                { val: 'auto', lbl: t('autoDiscover') || 'Auto-Discover' },
                { val: 'anchor', lbl: t('anchoredSearch') || 'Anchored' },
                { val: 'manual', lbl: t('manualExplorer') || 'Manual Explorer' }
              ].map((sub) => {
                const isActive = elsSubMode === sub.val;
                return (
                  <button
                    type="button"
                    key={sub.val}
                    onClick={() => setElsSubMode(sub.val)}
                    style={{
                      flex: 1,
                      border: isActive ? '1px solid rgba(56, 189, 248, 0.65)' : '1px solid transparent',
                      background: isActive ? '#162238' : 'transparent',
                      borderRadius: '8px',
                      padding: '6px 4px',
                      fontSize: '11px',
                      fontWeight: isActive ? '700' : '500',
                      color: isActive ? '#7dd3fc' : '#94a3b8',
                      boxShadow: isActive ? '0 0 12px rgba(56, 189, 248, 0.28)' : 'none',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    {sub.lbl}
                  </button>
                );
              })}
            </div>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid rgba(30, 41, 59, 0.9)', margin: '14px 0' }} />

          {/* MANUAL EXPLORER MODE */}
          {isManualSkipMode ? (
            <div>
              <label style={sectionLabelStyle}>{t('selectStartInstruction')}</label>

              {/* Single-Row Book + Chapter + Verse Labels */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '3px' }}>
                <div style={{ flex: '2.2 1 0', minWidth: 0, fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>
                  {t('book') ? t('book').replace(':', '') : 'Book'}
                </div>
                <div style={{ flex: '1 1 0', minWidth: 0, fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>
                  {t('chapter') || 'Chapter'}
                </div>
                <div style={{ flex: '1 1 0', minWidth: 0, fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>
                  {t('verse') || 'Verse'}
                </div>
              </div>

              {/* Single-Row Book + Chapter + Verse Selects */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                <div style={{ flex: '2.2 1 0', minWidth: 0 }}>
                  <select
                    value={manualConfig.bookId}
                    onChange={e => setManualConfig({ ...manualConfig, bookId: e.target.value, chapter: 1, verse: 1, letterIdx: null })}
                    style={singleRowSelectStyle}
                  >
                    {booksList.map(b => (
                      <option key={b.id} value={b.id}>
                        {getBookLabel(b)}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: '1 1 0', minWidth: 0 }}>
                  <select
                    value={manualConfig.chapter}
                    onChange={e => setManualConfig({ ...manualConfig, chapter: Number(e.target.value), letterIdx: null })}
                    style={singleRowSelectStyle}
                  >
                    {Array.from({ length: chaptersInBook }, (_, i) => i + 1).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: '1 1 0', minWidth: 0 }}>
                  <select
                    value={manualConfig.verse}
                    onChange={e => setManualConfig({ ...manualConfig, verse: Number(e.target.value), letterIdx: null })}
                    style={singleRowSelectStyle}
                  >
                    {versesInChapter.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                style={{
                  direction: 'rtl',
                  fontSize: '18px',
                  lineHeight: '1.85',
                  padding: '10px 12px',
                  border: '1px solid rgba(51, 65, 85, 0.85)',
                  borderRadius: '10px',
                  backgroundColor: '#090e1a',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  color: '#f1f5f9'
                }}
              >
                {verseText ? renderPickerVerse(verseText, manualConfig.letterIdx, (idx) => setManualConfig({ ...manualConfig, letterIdx: idx })) : '...'}
              </div>

              {/* Single Compact Row: Jump Size + Jump Count + Include Spaces */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <div style={{ flex: '0 0 76px' }}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px', whiteSpace: 'nowrap' }}>
                    {t('jumpSize') || 'Jump Size'}
                  </label>
                  <input
                    type="number"
                    enterKeyHint="search"
                    value={manualConfig.skip}
                    onKeyDown={handleInputKeyDown}
                    onChange={e => setManualConfig({ ...manualConfig, skip: Number(e.target.value) })}
                    style={{ width: '100%', padding: '7px 6px', borderRadius: '8px', border: '1px solid rgba(51, 65, 85, 0.85)', fontSize: '13px', backgroundColor: '#090e1a', color: '#f1f5f9', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ flex: '0 0 76px' }}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px', whiteSpace: 'nowrap' }}>
                    {t('jumpCount') || 'Jump Count'}
                  </label>
                  <input
                    type="number"
                    enterKeyHint="search"
                    value={manualConfig.count}
                    onKeyDown={handleInputKeyDown}
                    onChange={e => setManualConfig({ ...manualConfig, count: Number(e.target.value) })}
                    style={{ width: '100%', padding: '7px 6px', borderRadius: '8px', border: '1px solid rgba(51, 65, 85, 0.85)', fontSize: '13px', backgroundColor: '#090e1a', color: '#f1f5f9', boxSizing: 'border-box' }}
                  />
                </div>
                <label
                  htmlFor="spacesManual"
                  title={t('includeSpaces')}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    fontSize: '11px',
                    color: '#cbd5e1',
                    fontWeight: '600',
                    cursor: 'pointer',
                    backgroundColor: '#090e1a',
                    padding: '7px 6px',
                    borderRadius: '8px',
                    border: '1px solid rgba(51, 65, 85, 0.85)',
                    height: '34px',
                    boxSizing: 'border-box',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <input
                    type="checkbox"
                    id="spacesManual"
                    checked={includeSpaces}
                    onChange={e => setIncludeSpaces(e.target.checked)}
                    style={{ cursor: 'pointer', margin: 0, accentColor: '#38bdf8' }}
                  />
                  <span>{t('includeSpacesShort') || t('includeSpaces')}</span>
                </label>
              </div>
            </div>
          ) : (
            /* ANCHORED SEARCH, AUTO-DISCOVER, ACRONYM, & STANDARD SEARCH */
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: searchMode === 'els' && elsSubMode === 'anchor' ? '12px' : '0' }}>
                <input
                  type="text"
                  inputMode="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  value={searchTerm}
                  onKeyDown={handleInputKeyDown}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={getInputPlaceholder()}
                  aria-label={getInputPlaceholder()}
                  dir={isRTL ? 'rtl' : 'ltr'}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: '40px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(51, 65, 85, 0.9)',
                    fontSize: '14px',
                    backgroundColor: '#090e1a',
                    color: '#f1f5f9',
                    textAlign: isRTL ? 'right' : 'left',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />

                {/* Inline First / Last Toggle for Acronym Mode */}
                {searchMode === 'acronym' && (
                  <div
                    style={{
                      display: 'inline-flex',
                      backgroundColor: '#080d18',
                      borderRadius: '10px',
                      padding: '3px',
                      border: '1px solid rgba(51, 65, 85, 0.85)',
                      flexShrink: 0,
                      height: '40px',
                      alignItems: 'center'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleAcronymToggle('first')}
                      style={{
                        border: acronymPosition === 'first' ? '1px solid rgba(56, 189, 248, 0.55)' : '1px solid transparent',
                        borderRadius: '7px',
                        padding: '5px 8px',
                        fontSize: '11px',
                        fontWeight: acronymPosition === 'first' ? '700' : '500',
                        backgroundColor: acronymPosition === 'first' ? '#162238' : 'transparent',
                        color: acronymPosition === 'first' ? '#7dd3fc' : '#94a3b8',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s'
                      }}
                    >
                      {t('acronymFirst') || 'First'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAcronymToggle('last')}
                      style={{
                        border: acronymPosition === 'last' ? '1px solid rgba(56, 189, 248, 0.55)' : '1px solid transparent',
                        borderRadius: '7px',
                        padding: '5px 8px',
                        fontSize: '11px',
                        fontWeight: acronymPosition === 'last' ? '700' : '500',
                        backgroundColor: acronymPosition === 'last' ? '#162238' : 'transparent',
                        color: acronymPosition === 'last' ? '#7dd3fc' : '#94a3b8',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s'
                      }}
                    >
                      {t('acronymLast') || 'Last'}
                    </button>
                  </div>
                )}

                {searchMode === 'els' && (elsSubMode === 'auto' || elsSubMode === 'anchor') && (
                  <label
                    htmlFor="spacesEls"
                    title={t('includeSpaces')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      whiteSpace: 'nowrap',
                      fontSize: '11px',
                      color: '#cbd5e1',
                      fontWeight: '600',
                      cursor: 'pointer',
                      backgroundColor: '#090e1a',
                      padding: '0 8px',
                      height: '40px',
                      borderRadius: '10px',
                      border: '1px solid rgba(51, 65, 85, 0.85)',
                      flexShrink: 0
                    }}
                  >
                    <input
                      type="checkbox"
                      id="spacesEls"
                      checked={includeSpaces}
                      onChange={e => setIncludeSpaces(e.target.checked)}
                      style={{ cursor: 'pointer', margin: 0, accentColor: '#38bdf8' }}
                    />
                    <span>{t('includeSpacesShort') || t('includeSpaces')}</span>
                  </label>
                )}

                {/* Single Mobile Run Trigger (Always Visible Above Mobile Keyboard) */}
                <button
                  type="button"
                  onClick={() => handleSearch()}
                  disabled={loading}
                  className="mobile-inline-run-btn"
                  aria-label={t('runAnalysis') || 'Run Analysis'}
                  title={t('runAnalysis') || 'Run Analysis'}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </button>
              </div>

              {/* DEDICATED ANCHORED SEARCH PICKER */}
              {searchMode === 'els' && elsSubMode === 'anchor' && (
                <div>
                  <label style={sectionLabelStyle}>{t('selectStartInstruction')}</label>

                  {/* Single-Row Book + Chapter + Verse Labels */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '3px' }}>
                    <div style={{ flex: '2.2 1 0', minWidth: 0, fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>
                      {t('book') ? t('book').replace(':', '') : 'Book'}
                    </div>
                    <div style={{ flex: '1 1 0', minWidth: 0, fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>
                      {t('chapter') || 'Chapter'}
                    </div>
                    <div style={{ flex: '1 1 0', minWidth: 0, fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>
                      {t('verse') || 'Verse'}
                    </div>
                  </div>

                  {/* Single-Row Book + Chapter + Verse Selects */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                    <div style={{ flex: '2.2 1 0', minWidth: 0 }}>
                      <select
                        value={anchorConfig.bookId}
                        onChange={e => setAnchorConfig({ ...anchorConfig, bookId: e.target.value, chapter: 1, verse: 1, letterIdx: null })}
                        style={singleRowSelectStyle}
                      >
                        {booksList.map(b => (
                          <option key={b.id} value={b.id}>
                            {getBookLabel(b)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: '1 1 0', minWidth: 0 }}>
                      <select
                        value={anchorConfig.chapter}
                        onChange={e => setAnchorConfig({ ...anchorConfig, chapter: Number(e.target.value), letterIdx: null })}
                        style={singleRowSelectStyle}
                      >
                        {Array.from({ length: anchorChaptersInBook }, (_, i) => i + 1).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: '1 1 0', minWidth: 0 }}>
                      <select
                        value={anchorConfig.verse}
                        onChange={e => setAnchorConfig({ ...anchorConfig, verse: Number(e.target.value), letterIdx: null })}
                        style={singleRowSelectStyle}
                      >
                        {anchorVersesInChapter.map(v => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div
                    style={{
                      direction: 'rtl',
                      fontSize: '18px',
                      lineHeight: '1.85',
                      padding: '10px 12px',
                      border: '1px solid rgba(51, 65, 85, 0.85)',
                      borderRadius: '10px',
                      backgroundColor: '#090e1a',
                      maxHeight: '120px',
                      overflowY: 'auto',
                      color: '#f1f5f9'
                    }}
                  >
                    {anchorVerseText ? renderPickerVerse(anchorVerseText, anchorConfig.letterIdx, (idx) => setAnchorConfig({ ...anchorConfig, letterIdx: idx })) : '...'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* LUMINOUS COMPARISON SCOPES TRIGGER CARD */}
        {showComparisonScopes && (
          <div style={{ padding: '10px 18px 16px 18px' }}>
            <label style={sectionLabelStyle}>{t('comparisonScopes') || 'Comparison Scopes'}</label>
            <button
              type="button"
              className="hover-lift"
              onClick={() => (isScopeOpen ? onCloseScope?.() : onOpenScope?.())}
              disabled={loading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                padding: '11px 13px',
                borderRadius: '12px',
                border: '1px solid rgba(56, 189, 248, 0.55)',
                background: 'linear-gradient(135deg, #10192e 0%, #14203a 100%)',
                color: '#f1f5f9',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 0 18px -3px rgba(56, 189, 248, 0.28), inset 0 0 10px rgba(56, 189, 248, 0.06)'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '9px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(56, 189, 248, 0.14)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    color: '#38bdf8',
                    flexShrink: 0
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {getScopeSummary()}
                </span>
              </span>
              <span style={{ color: '#7dd3fc', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {isScopeOpen ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="21" x2="4" y2="14" />
                    <line x1="4" y1="10" x2="4" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12" y2="3" />
                    <line x1="20" y1="21" x2="20" y2="16" />
                    <line x1="20" y1="12" x2="20" y2="3" />
                    <line x1="1" y1="14" x2="7" y2="14" />
                    <line x1="9" y1="8" x2="15" y2="8" />
                    <line x1="17" y1="16" x2="23" y2="16" />
                  </svg>
                )}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Desktop Footer (Hidden on Mobile Whenever Inline Search Button Is Active) */}
      <div
        className={`sidebar-footer ${hasInlineRunButton ? 'hide-on-mobile' : ''}`}
        style={{
          flexShrink: 0,
          marginTop: 'auto',
          zIndex: 25
        }}
      >
        <button type="button" onClick={() => handleSearch()} disabled={loading} className="btn btn-run">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span>{loading ? (t('processing') || 'Processing...') : (t('runAnalysis') || 'Run Analysis')}</span>
        </button>
      </div>
    </aside>
  );
}

export default ControlSidebar;