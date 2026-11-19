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
  const sectionLabelStyle = { display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6c757d', fontWeight: 'bold', marginBottom: '8px' };

  const [manualData, setManualData] = useState([]);
  const [verseText, setVerseText] = useState("");
  const [anchorVerseText, setAnchorVerseText] = useState("");
  const [chaptersInBook, setChaptersInBook] = useState(50);
  const [anchorChaptersInBook, setAnchorChaptersInBook] = useState(50);
  const [versesInChapter, setVersesInChapter] = useState([]);
  const [anchorVersesInChapter, setAnchorVersesInChapter] = useState([]);

  const currentGroup = ['exact', 'root', 'letter', 'acronym'].includes(searchMode) ? 'text' : searchMode;
  const showComparisonScopes = !(searchMode === 'els' && (elsSubMode === 'manual' || elsSubMode === 'anchor'));

  const getInputPlaceholder = () => {
    if (searchMode === 'els') return t('placeholderEls');
    if (searchMode === 'gematria') return t('placeholderGematria');
    if (searchMode === 'acronym') return t('placeholderAcronym');
    return t('placeholderText');
  };

  const getScopeSummary = () => {
    const activeRanges = (ranges || []).filter(r => r.selectedChapters.length > 0);
    if (activeRanges.length === 0) {
      return t('noBooksSelected') !== 'noBooksSelected' ? t('noBooksSelected') : 'No books selected';
    }
    if (activeRanges.length === 1) {
      const r = activeRanges[0];
      const book = booksList.find(b => b.id === r.bookId);
      const bookName = book ? (lang === 'he' ? book.he : (lang === 'fa' ? book.fa : book.name.replace('_', ' '))) : '';
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
                        cursor: 'pointer', backgroundColor: isSelected ? '#0056b3' : 'transparent',
                        color: isSelected ? '#fff' : 'inherit', borderRadius: '3px', padding: '0 2px',
                        display: 'inline-block', transform: isSelected ? 'scale(1.2)' : 'none',
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

  return (
    <aside
      className={`control-sidebar ${mobileView === 'search' ? 'mobile-active' : 'mobile-hidden'}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
        borderLeft: lang === 'en' ? '1px solid #e9ecef' : 'none',
        borderRight: lang !== 'en' ? '1px solid #e9ecef' : 'none'
      }}
    >
      {/* Scrollable Upper Container */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '16px 20px 10px 20px' }}>
          <div style={{ display: 'flex', borderRadius: '6px', border: '1px solid #ced4da', overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
            <button
              onClick={() => { if (currentGroup !== 'text') setSearchMode('exact'); }}
              style={{ flex: 1, border: 'none', padding: '8px 2px', fontSize: '11px', fontWeight: currentGroup === 'text' ? 'bold' : 'normal', backgroundColor: currentGroup === 'text' ? '#0056b3' : 'transparent', color: currentGroup === 'text' ? '#fff' : '#495057', cursor: 'pointer', transition: 'all 0.2s', borderRight: lang === 'en' ? '1px solid #ced4da' : 'none', borderLeft: lang !== 'en' ? '1px solid #ced4da' : 'none' }}
            >
              {t('textSearch') || "Text Search"}
            </button>
            <button
              onClick={() => setSearchMode('gematria')}
              style={{ flex: 1, border: 'none', padding: '8px 2px', fontSize: '11px', fontWeight: currentGroup === 'gematria' ? 'bold' : 'normal', backgroundColor: currentGroup === 'gematria' ? '#0056b3' : 'transparent', color: currentGroup === 'gematria' ? '#fff' : '#495057', cursor: 'pointer', transition: 'all 0.2s', borderRight: lang === 'en' ? '1px solid #ced4da' : 'none', borderLeft: lang !== 'en' ? '1px solid #ced4da' : 'none' }}
            >
              {t('gematria') || "Gematria"}
            </button>
            <button
              onClick={() => setSearchMode('els')}
              style={{ flex: 1, border: 'none', padding: '8px 2px', fontSize: '11px', fontWeight: currentGroup === 'els' ? 'bold' : 'normal', backgroundColor: currentGroup === 'els' ? '#0056b3' : 'transparent', color: currentGroup === 'els' ? '#fff' : '#495057', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              {t('els') || "ELS"}
            </button>
          </div>

          {currentGroup === 'text' && (
            <div style={{ display: 'flex', marginTop: '12px', backgroundColor: '#e9ecef', borderRadius: '6px', padding: '4px', gap: '2px' }}>
              {[
                { val: 'exact', lbl: t('exact') || "Exact" },
                { val: 'root', lbl: t('root') || "Root" },
                { val: 'letter', lbl: t('letter') || "Letter" },
                { val: 'acronym', lbl: t('acronym') || "Acronym" }
              ].map(m => (
                 <button
                   key={m.val}
                   onClick={() => setSearchMode(m.val)}
                   style={{
                     flex: m.val === 'acronym' ? 1.25 : 1,
                     border: 'none',
                     background: searchMode === m.val ? '#fff' : 'transparent',
                     borderRadius: '4px',
                     padding: '6px 3px',
                     fontSize: '11px',
                     fontWeight: searchMode === m.val ? 'bold' : 'normal',
                     color: searchMode === m.val ? '#0056b3' : '#495057',
                     cursor: 'pointer',
                     whiteSpace: 'nowrap'
                   }}
                 >
                   {m.lbl}
                 </button>
              ))}
            </div>
          )}

          {/* THREE-WAY ELS SUB-MODE SWITCHER */}
          {currentGroup === 'els' && (
            <div style={{ display: 'flex', marginTop: '12px', backgroundColor: '#e9ecef', borderRadius: '6px', padding: '4px', gap: '2px' }}>
               {[
                 { val: 'auto', lbl: t('autoDiscover') || "Auto-Discover" },
                 { val: 'anchor', lbl: t('anchoredSearch') || "Anchored" },
                 { val: 'manual', lbl: t('manualExplorer') || "Manual Explorer" }
               ].map(sub => (
                 <button
                   key={sub.val}
                   onClick={() => setElsSubMode(sub.val)}
                   style={{ flex: 1, border: 'none', background: elsSubMode === sub.val ? '#fff' : 'transparent', borderRadius: '4px', padding: '6px 4px', fontSize: '11px', fontWeight: elsSubMode === sub.val ? 'bold' : 'normal', color: elsSubMode === sub.val ? '#0056b3' : '#495057', cursor: 'pointer', whiteSpace: 'nowrap' }}
                 >
                   {sub.lbl}
                 </button>
               ))}
            </div>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid #e9ecef', margin: '14px 0' }} />

          {/* MANUAL EXPLORER MODE */}
          {searchMode === 'els' && elsSubMode === 'manual' ? (
            <div>
              <label style={sectionLabelStyle}>{t('selectStartInstruction')}</label>

              <div style={{ display: 'flex', gap: '5px', marginBottom: '2px' }}>
                 <div style={{ flex: 2, fontSize: '10px', color: '#6c757d', fontWeight: 'bold' }}>{t('book') ? t('book').replace(':','') : 'Book'}</div>
                 <div style={{ flex: 1, fontSize: '10px', color: '#6c757d', fontWeight: 'bold' }}>{t('chapter') || 'Chapter'}</div>
                 <div style={{ flex: 1, fontSize: '10px', color: '#6c757d', fontWeight: 'bold' }}>{t('verse') || 'Verse'}</div>
              </div>

              <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                 <select value={manualConfig.bookId} onChange={e => setManualConfig({...manualConfig, bookId: e.target.value, chapter: 1, verse: 1, letterIdx: null})} style={{ flex: 2, padding: '6px', fontSize: '12px' }}>
                   {booksList.map(b => <option key={b.id} value={b.id}>{lang === 'he' ? b.he : (lang === 'fa' ? b.fa : b.name)}</option>)}
                 </select>
                 <select value={manualConfig.chapter} onChange={e => setManualConfig({...manualConfig, chapter: Number(e.target.value), letterIdx: null})} style={{ flex: 1, padding: '6px', fontSize: '12px' }}>
                   {Array.from({length: chaptersInBook}, (_, i) => i + 1).map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
                 <select value={manualConfig.verse} onChange={e => setManualConfig({...manualConfig, verse: Number(e.target.value), letterIdx: null})} style={{ flex: 1, padding: '6px', fontSize: '12px' }}>
                   {versesInChapter.map(v => <option key={v} value={v}>{v}</option>)}
                 </select>
              </div>

              <div style={{ direction: 'rtl', fontSize: '18px', lineHeight: '1.8', padding: '10px', border: '1px solid #ced4da', borderRadius: '6px', backgroundColor: '#f8f9fa', maxHeight: '120px', overflowY: 'auto' }}>
                 {verseText ? renderPickerVerse(verseText, manualConfig.letterIdx, (idx) => setManualConfig({...manualConfig, letterIdx: idx})) : "..."}
              </div>

              {/* Single Compact Row: Jump Size + Jump Count + Include Spaces */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <div style={{ flex: '0 0 76px' }}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#495057', marginBottom: '4px', whiteSpace: 'nowrap' }}>
                    {t('jumpSize') || "Jump Size"}
                  </label>
                  <input
                    type="number"
                    value={manualConfig.skip}
                    onChange={e => setManualConfig({...manualConfig, skip: Number(e.target.value)})}
                    style={{ width: '100%', padding: '7px 6px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ flex: '0 0 76px' }}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#495057', marginBottom: '4px', whiteSpace: 'nowrap' }}>
                    {t('jumpCount') || "Jump Count"}
                  </label>
                  <input
                    type="number"
                    value={manualConfig.count}
                    onChange={e => setManualConfig({...manualConfig, count: Number(e.target.value)})}
                    style={{ width: '100%', padding: '7px 6px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '13px', boxSizing: 'border-box' }}
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
                    color: '#343a40',
                    fontWeight: '500',
                    cursor: 'pointer',
                    backgroundColor: '#f8f9fa',
                    padding: '7px 6px',
                    borderRadius: '6px',
                    border: '1px solid #ced4da',
                    height: '33px',
                    boxSizing: 'border-box',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <input
                    type="checkbox"
                    id="spacesManual"
                    checked={includeSpaces}
                    onChange={e => setIncludeSpaces(e.target.checked)}
                    style={{ cursor: 'pointer', margin: 0 }}
                  />
                  <span>{t('includeSpacesShort') || t('includeSpaces')}</span>
                </label>
              </div>
            </div>
          ) : (
            /* ANCHORED SEARCH, AUTO-DISCOVER, ACRONYM, & STANDARD SEARCH */
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: searchMode === 'els' && elsSubMode === 'anchor' ? '12px' : '0' }}>
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={getInputPlaceholder()}
                  aria-label={getInputPlaceholder()}
                  dir={isRTL ? 'rtl' : 'ltr'}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: '9px 10px',
                    borderRadius: '6px',
                    border: '1px solid #ced4da',
                    fontSize: '13px',
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
                      backgroundColor: '#e9ecef',
                      borderRadius: '6px',
                      padding: '2px',
                      border: '1px solid #ced4da',
                      flexShrink: 0
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setAcronymPosition('first')}
                      style={{
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 8px',
                        fontSize: '11px',
                        fontWeight: acronymPosition === 'first' ? 'bold' : 'normal',
                        backgroundColor: acronymPosition === 'first' ? '#ffffff' : 'transparent',
                        color: acronymPosition === 'first' ? '#0056b3' : '#495057',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s'
                      }}
                    >
                      {t('acronymFirst') || "First"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAcronymPosition('last')}
                      style={{
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 8px',
                        fontSize: '11px',
                        fontWeight: acronymPosition === 'last' ? 'bold' : 'normal',
                        backgroundColor: acronymPosition === 'last' ? '#ffffff' : 'transparent',
                        color: acronymPosition === 'last' ? '#0056b3' : '#495057',
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
                      color: '#343a40',
                      fontWeight: '500',
                      cursor: 'pointer',
                      backgroundColor: '#f8f9fa',
                      padding: '8px 8px',
                      borderRadius: '6px',
                      border: '1px solid #ced4da',
                      flexShrink: 0
                    }}
                  >
                    <input
                      type="checkbox"
                      id="spacesEls"
                      checked={includeSpaces}
                      onChange={e => setIncludeSpaces(e.target.checked)}
                      style={{ cursor: 'pointer', margin: 0 }}
                    />
                    <span>{t('includeSpacesShort') || t('includeSpaces')}</span>
                  </label>
                )}
              </div>

              {/* DEDICATED ANCHORED SEARCH PICKER */}
              {searchMode === 'els' && elsSubMode === 'anchor' && (
                <div>
                  <label style={sectionLabelStyle}>{t('selectStartInstruction')}</label>

                  <div style={{ display: 'flex', gap: '5px', marginBottom: '2px' }}>
                     <div style={{ flex: 2, fontSize: '10px', color: '#6c757d', fontWeight: 'bold' }}>{t('book') ? t('book').replace(':','') : 'Book'}</div>
                     <div style={{ flex: 1, fontSize: '10px', color: '#6c757d', fontWeight: 'bold' }}>{t('chapter') || 'Chapter'}</div>
                     <div style={{ flex: 1, fontSize: '10px', color: '#6c757d', fontWeight: 'bold' }}>{t('verse') || 'Verse'}</div>
                  </div>

                  <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                     <select value={anchorConfig.bookId} onChange={e => setAnchorConfig({...anchorConfig, bookId: e.target.value, chapter: 1, verse: 1, letterIdx: null})} style={{ flex: 2, padding: '6px', fontSize: '12px' }}>
                       {booksList.map(b => <option key={b.id} value={b.id}>{lang === 'he' ? b.he : (lang === 'fa' ? b.fa : b.name)}</option>)}
                     </select>
                     <select value={anchorConfig.chapter} onChange={e => setAnchorConfig({...anchorConfig, chapter: Number(e.target.value), letterIdx: null})} style={{ flex: 1, padding: '6px', fontSize: '12px' }}>
                       {Array.from({length: anchorChaptersInBook}, (_, i) => i + 1).map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                     <select value={anchorConfig.verse} onChange={e => setAnchorConfig({...anchorConfig, verse: Number(e.target.value), letterIdx: null})} style={{ flex: 1, padding: '6px', fontSize: '12px' }}>
                       {anchorVersesInChapter.map(v => <option key={v} value={v}>{v}</option>)}
                     </select>
                  </div>

                  <div style={{ direction: 'rtl', fontSize: '18px', lineHeight: '1.8', padding: '10px', border: '1px solid #ced4da', borderRadius: '6px', backgroundColor: '#f8f9fa', maxHeight: '120px', overflowY: 'auto' }}>
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
                border: isScopeOpen ? '1.5px solid #0056b3' : '1px solid #ced4da',
                backgroundColor: isScopeOpen ? '#e7f1ff' : '#f8f9fa',
                color: isScopeOpen ? '#0056b3' : '#1e293b',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getScopeSummary()}
              </span>
              <span style={{ fontSize: '12px', color: '#0056b3', flexShrink: 0 }}>
                {isScopeOpen ? '✕' : '☰'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Permanently Pinned Footer */}
      <div
        className="sidebar-footer"
        style={{
          flexShrink: 0,
          marginTop: 'auto',
          backgroundColor: '#ffffff',
          padding: '14px 20px',
          borderTop: '1px solid #e9ecef',
          zIndex: 25
        }}
      >
        <button onClick={handleSearch} disabled={loading} className="btn btn-run" style={{ width: '100%' }}>
          {loading ? (t('processing') || "Processing...") : (t('runAnalysis') || "Run Analysis")}
        </button>
      </div>
    </aside>
  );
}

export default ControlSidebar;