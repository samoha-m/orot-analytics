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
  const sectionLabelStyle = { display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', fontWeight: '700', marginBottom: '8px' };

  const [manualData, setManualData] = useState([]);
  const [verseText, setVerseText] = useState("");
  const [anchorVerseText, setAnchorVerseText] = useState("");
  const [chaptersInBook, setChaptersInBook] = useState(50);
  const [anchorChaptersInBook, setAnchorChaptersInBook] = useState(50);
  const [versesInChapter, setVersesInChapter] = useState([]);
  const [anchorVersesInChapter, setAnchorVersesInChapter] = useState([]);

  const currentGroup = ['exact', 'root', 'letter', 'acronym'].includes(searchMode) ? 'text' : searchMode;
  const isManualSkipMode = searchMode === 'els' && elsSubMode === 'manual';
  const showComparisonScopes = !(searchMode === 'els' && (elsSubMode === 'manual' || elsSubMode === 'anchor'));
  // Every mode except Manual Explorer has the inline search button beside the text box on mobile
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

  // Auto-refresh results immediately when toggling Acronym First / Last
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
        setManualConfig({...manualConfig, verse: vList[0], letterIdx: null});
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
            setAnchorConfig({...anchorConfig, verse: vList[0], letterIdx: null});
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
                        backgroundColor: isSelected ? '#1d4ed8' : 'transparent',
                        color: isSelected ? '#ffffff' : 'inherit',
                        borderRadius: '4px',
                        padding: '0 3px',
                        display: 'inline-block',
                        transform: isSelected ? 'scale(1.18)' : 'none',
                        fontWeight: isSelected ? '700' : 'normal',
                        transition: 'all 0.1s'
                    }}
                >
                    {char}
                </span>
            );
        } else {
            return <span key={idx}>{char}</span>;
        }
    });
  };

  const singleRowSelectStyle = {
    width: '100%',
    minWidth: 0,
    height: '36px',
    padding: '6px 5px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#1e293b',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
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
        borderLeft: lang === 'en' ? '1px solid #e2e8f0' : 'none',
        borderRight: lang !== 'en' ? '1px solid #e2e8f0' : 'none'
      }}
    >
      {/* Scrollable Upper Container */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '16px 20px 10px 20px' }}>
          {/* Primary Mode Switcher */}
          <div style={{ display: 'flex', borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
            <button
              type="button"
              onClick={() => { if (currentGroup !== 'text') setSearchMode('exact'); }}
              style={{ flex: 1, border: 'none', padding: '9px 2px', fontSize: '12px', fontWeight: currentGroup === 'text' ? '700' : '500', backgroundColor: currentGroup === 'text' ? '#1d4ed8' : 'transparent', color: currentGroup === 'text' ? '#fff' : '#475569', cursor: 'pointer', transition: 'all 0.15s', borderRight: lang === 'en' ? '1px solid #cbd5e1' : 'none', borderLeft: lang !== 'en' ? '1px solid #cbd5e1' : 'none' }}
            >
              {t('textSearch') || "Text Search"}
            </button>
            <button
              type="button"
              onClick={() => setSearchMode('gematria')}
              style={{ flex: 1, border: 'none', padding: '9px 2px', fontSize: '12px', fontWeight: currentGroup === 'gematria' ? '700' : '500', backgroundColor: currentGroup === 'gematria' ? '#1d4ed8' : 'transparent', color: currentGroup === 'gematria' ? '#fff' : '#475569', cursor: 'pointer', transition: 'all 0.15s', borderRight: lang === 'en' ? '1px solid #cbd5e1' : 'none', borderLeft: lang !== 'en' ? '1px solid #cbd5e1' : 'none' }}
            >
              {t('gematria') || "Gematria"}
            </button>
            <button
              type="button"
              onClick={() => setSearchMode('els')}
              style={{ flex: 1, border: 'none', padding: '9px 2px', fontSize: '12px', fontWeight: currentGroup === 'els' ? '700' : '500', backgroundColor: currentGroup === 'els' ? '#1d4ed8' : 'transparent', color: currentGroup === 'els' ? '#fff' : '#475569', cursor: 'pointer', transition: 'all 0.15s' }}
            >
              {t('els') || "Skip"}
            </button>
          </div>

          {/* 4-Pill Text Sub-Mode Switcher */}
          {currentGroup === 'text' && (
            <div style={{ display: 'flex', marginTop: '12px', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '4px', gap: '3px', border: '1px solid #e2e8f0' }}>
              {[
                { val: 'exact', lbl: t('exact') || "Exact" },
                { val: 'root', lbl: t('root') || "Root" },
                { val: 'letter', lbl: t('letter') || "Letter" },
                { val: 'acronym', lbl: t('acronym') || "Acronym" }
              ].map(m => (
                 <button
                   type="button"
                   key={m.val}
                   onClick={() => setSearchMode(m.val)}
                   style={{
                     flex: m.val === 'acronym' ? 1.25 : 1,
                     border: 'none',
                     background: searchMode === m.val ? '#ffffff' : 'transparent',
                     borderRadius: '6px',
                     padding: '6px 3px',
                     fontSize: '11px',
                     fontWeight: searchMode === m.val ? '700' : '500',
                     color: searchMode === m.val ? '#1d4ed8' : '#475569',
                     boxShadow: searchMode === m.val ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
                     cursor: 'pointer',
                     whiteSpace: 'nowrap',
                     transition: 'all 0.15s'
                   }}
                 >
                   {m.lbl}
                 </button>
              ))}
            </div>
          )}

          {/* 3-Way Skip Sub-Mode Switcher */}
          {currentGroup === 'els' && (
            <div style={{ display: 'flex', marginTop: '12px', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '4px', gap: '3px', border: '1px solid #e2e8f0' }}>
               {[
                 { val: 'auto', lbl: t('autoDiscover') || "Auto-Discover" },
                 { val: 'anchor', lbl: t('anchoredSearch') || "Anchored" },
                 { val: 'manual', lbl: t('manualExplorer') || "Manual Explorer" }
               ].map(sub => (
                 <button
                   type="button"
                   key={sub.val}
                   onClick={() => setElsSubMode(sub.val)}
                   style={{
                     flex: 1,
                     border: 'none',
                     background: elsSubMode === sub.val ? '#ffffff' : 'transparent',
                     borderRadius: '6px',
                     padding: '6px 4px',
                     fontSize: '11px',
                     fontWeight: elsSubMode === sub.val ? '700' : '500',
                     color: elsSubMode === sub.val ? '#1d4ed8' : '#475569',
                     boxShadow: elsSubMode === sub.val ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
                     cursor: 'pointer',
                     whiteSpace: 'nowrap',
                     transition: 'all 0.15s'
                   }}
                 >
                   {sub.lbl}
                 </button>
               ))}
            </div>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '14px 0' }} />

          {/* MANUAL EXPLORER MODE */}
          {isManualSkipMode ? (
            <div>
              <label style={sectionLabelStyle}>{t('selectStartInstruction')}</label>

              {/* Single-Row Book + Chapter + Verse Labels */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '3px' }}>
                <div style={{ flex: '2.2 1 0', minWidth: 0, fontSize: '10px', color: '#64748b', fontWeight: '700' }}>
                  {t('book') ? t('book').replace(':', '') : 'Book'}
                </div>
                <div style={{ flex: '1 1 0', minWidth: 0, fontSize: '10px', color: '#64748b', fontWeight: '700' }}>
                  {t('chapter') || 'Chapter'}
                </div>
                <div style={{ flex: '1 1 0', minWidth: 0, fontSize: '10px', color: '#64748b', fontWeight: '700' }}>
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

              <div style={{ direction: 'rtl', fontSize: '18px', lineHeight: '1.85', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc', maxHeight: '120px', overflowY: 'auto', color: '#0f172a' }}>
                 {verseText ? renderPickerVerse(verseText, manualConfig.letterIdx, (idx) => setManualConfig({...manualConfig, letterIdx: idx})) : "..."}
              </div>

              {/* Single Compact Row: Jump Size + Jump Count + Include Spaces */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <div style={{ flex: '0 0 76px' }}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#475569', marginBottom: '4px', whiteSpace: 'nowrap' }}>
                    {t('jumpSize') || "Jump Size"}
                  </label>
                  <input
                    type="number"
                    enterKeyHint="search"
                    value={manualConfig.skip}
                    onKeyDown={handleInputKeyDown}
                    onChange={e => setManualConfig({...manualConfig, skip: Number(e.target.value)})}
                    style={{ width: '100%', padding: '7px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#ffffff', color: '#1e293b', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ flex: '0 0 76px' }}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#475569', marginBottom: '4px', whiteSpace: 'nowrap' }}>
                    {t('jumpCount') || "Jump Count"}
                  </label>
                  <input
                    type="number"
                    enterKeyHint="search"
                    value={manualConfig.count}
                    onKeyDown={handleInputKeyDown}
                    onChange={e => setManualConfig({...manualConfig, count: Number(e.target.value)})}
                    style={{ width: '100%', padding: '7px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#ffffff', color: '#1e293b', boxSizing: 'border-box' }}
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
                    color: '#334155',
                    fontWeight: '600',
                    cursor: 'pointer',
                    backgroundColor: '#f8fafc',
                    padding: '7px 6px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
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
                    style={{ cursor: 'pointer', margin: 0, accentColor: '#1d4ed8' }}
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
                    height: '38px',
                    padding: '8px 11px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    backgroundColor: '#ffffff',
                    color: '#1e293b',
                    textAlign: isRTL ? 'right' : 'left',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />

                {/* Inline First / Last Toggle for Acronym Mode (Auto-Refreshes Results) */}
                {searchMode === 'acronym' && (
                  <div
                    style={{
                      display: 'inline-flex',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '8px',
                      padding: '3px',
                      border: '1px solid #cbd5e1',
                      flexShrink: 0,
                      height: '38px',
                      alignItems: 'center'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleAcronymToggle('first')}
                      style={{
                        border: 'none',
                        borderRadius: '5px',
                        padding: '5px 8px',
                        fontSize: '11px',
                        fontWeight: acronymPosition === 'first' ? '700' : '500',
                        backgroundColor: acronymPosition === 'first' ? '#ffffff' : 'transparent',
                        color: acronymPosition === 'first' ? '#1d4ed8' : '#475569',
                        boxShadow: acronymPosition === 'first' ? '0 1px 2px rgba(15, 23, 42, 0.08)' : 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s'
                      }}
                    >
                      {t('acronymFirst') || "First"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAcronymToggle('last')}
                      style={{
                        border: 'none',
                        borderRadius: '5px',
                        padding: '5px 8px',
                        fontSize: '11px',
                        fontWeight: acronymPosition === 'last' ? '700' : '500',
                        backgroundColor: acronymPosition === 'last' ? '#ffffff' : 'transparent',
                        color: acronymPosition === 'last' ? '#1d4ed8' : '#475569',
                        boxShadow: acronymPosition === 'last' ? '0 1px 2px rgba(15, 23, 42, 0.08)' : 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s'
                      }}
                    >
                      {t('acronymLast') || "Last"}
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
                      color: '#334155',
                      fontWeight: '600',
                      cursor: 'pointer',
                      backgroundColor: '#f8fafc',
                      padding: '0 8px',
                      height: '38px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      flexShrink: 0
                    }}
                  >
                    <input
                      type="checkbox"
                      id="spacesEls"
                      checked={includeSpaces}
                      onChange={e => setIncludeSpaces(e.target.checked)}
                      style={{ cursor: 'pointer', margin: 0, accentColor: '#1d4ed8' }}
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
                  aria-label={t('runAnalysis') || "Run Analysis"}
                  title={t('runAnalysis') || "Run Analysis"}
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
                    <div style={{ flex: '2.2 1 0', minWidth: 0, fontSize: '10px', color: '#64748b', fontWeight: '700' }}>
                      {t('book') ? t('book').replace(':', '') : 'Book'}
                    </div>
                    <div style={{ flex: '1 1 0', minWidth: 0, fontSize: '10px', color: '#64748b', fontWeight: '700' }}>
                      {t('chapter') || 'Chapter'}
                    </div>
                    <div style={{ flex: '1 1 0', minWidth: 0, fontSize: '10px', color: '#64748b', fontWeight: '700' }}>
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

                  <div style={{ direction: 'rtl', fontSize: '18px', lineHeight: '1.85', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc', maxHeight: '120px', overflowY: 'auto', color: '#0f172a' }}>
                     {anchorVerseText ? renderPickerVerse(anchorVerseText, anchorConfig.letterIdx, (idx) => setAnchorConfig({...anchorConfig, letterIdx: idx})) : "..."}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* COMPACT COMPARISON SCOPES TRIGGER BUTTON */}
        {showComparisonScopes && (
          <div style={{ padding: '10px 20px 16px 20px' }}>
            <label style={sectionLabelStyle}>{t('comparisonScopes') || "Comparison Scopes"}</label>
            <button
              type="button"
              onClick={() => (isScopeOpen ? onCloseScope?.() : onOpenScope?.())}
              disabled={loading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: isScopeOpen ? '1.5px solid #1d4ed8' : '1px solid #cbd5e1',
                backgroundColor: isScopeOpen ? '#eff6ff' : '#f8fafc',
                color: isScopeOpen ? '#1e3a8a' : '#1e293b',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {getScopeSummary()}
                </span>
              </span>
              <span style={{ color: '#1d4ed8', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
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
          backgroundColor: '#ffffff',
          padding: '14px 20px',
          borderTop: '1px solid #e2e8f0',
          zIndex: 25
        }}
      >
        <button type="button" onClick={() => handleSearch()} disabled={loading} className="btn btn-run">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span>{loading ? (t('processing') || "Processing...") : (t('runAnalysis') || "Run Analysis")}</span>
        </button>
      </div>
    </aside>
  );
}

export default ControlSidebar;