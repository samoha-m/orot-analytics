import React, { useState, useEffect } from 'react';
import { booksList, numberToHebrew } from '../data/constants';

function ControlSidebar({
  showMobilePanel, setShowMobilePanel,
  searchTerm, setSearchTerm,
  searchMode, setSearchMode,
  ranges, loading,
  updateBook, removeRange, toggleAccordion,
  handleChapterSelection, addRange, handleSearch,
  t, lang,
  elsSubMode, setElsSubMode, manualConfig, setManualConfig
}) {
  const sectionLabelStyle = { display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6c757d', fontWeight: 'bold', marginBottom: '8px' };

  const [manualData, setManualData] = useState([]);
  const [verseText, setVerseText] = useState("");
  const [chaptersInBook, setChaptersInBook] = useState(50);
  const [versesInChapter, setVersesInChapter] = useState([]);

  const currentGroup = ['exact', 'root', 'letter'].includes(searchMode) ? 'text' : searchMode;

  // DYNAMIC INPUT TITLE LOGIC
  const getInputTitle = () => {
    if (searchMode === 'els') return t('searchTarget');
    if (searchMode === 'gematria') return t('compareGematria');
    return t('compareTerms');
  };

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

  const renderPickerVerse = () => {
    let letterCounter = 0;
    return verseText.split('').map((char, idx) => {
        if (/[\u0590-\u05FF]/.test(char)) {
            const currentLetterIdx = letterCounter++;
            const isSelected = manualConfig.letterIdx === currentLetterIdx;
            return (
                <span
                    key={idx}
                    onClick={() => setManualConfig({...manualConfig, letterIdx: currentLetterIdx})}
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
    <>
      <button className="mobile-trigger" onClick={() => setShowMobilePanel(true)}>{t('editSearch') || "Edit Search"}</button>
      {showMobilePanel && <div className="mobile-overlay" onClick={() => setShowMobilePanel(false)}></div>}

      <aside className={`control-sidebar ${showMobilePanel ? 'open' : ''}`} style={{ borderLeft: lang === 'en' ? '1px solid #e9ecef' : 'none', borderRight: lang !== 'en' ? '1px solid #e9ecef' : 'none' }}>

        <div style={{ position: 'sticky', top: 0, zIndex: 20, backgroundColor: '#ffffff', padding: '20px', borderBottom: '1px solid #e9ecef', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <label style={sectionLabelStyle}>{t('searchLogicMode') || "Logic"}</label>
            <button className="mobile-close" onClick={() => setShowMobilePanel(false)} style={{ display: showMobilePanel ? 'block' : 'none' }}>✖</button>
          </div>

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
            <div style={{ display: 'flex', marginTop: '12px', backgroundColor: '#e9ecef', borderRadius: '6px', padding: '4px' }}>
              {[ { val: 'exact', lbl: t('exact') || "Exact" }, { val: 'root', lbl: t('root') || "Root" }, { val: 'letter', lbl: t('letter') || "Letter" } ].map(m => (
                 <button
                   key={m.val}
                   onClick={() => setSearchMode(m.val)}
                   style={{ flex: 1, border: 'none', background: searchMode === m.val ? '#fff' : 'transparent', borderRadius: '4px', padding: '6px', fontSize: '11px', fontWeight: searchMode === m.val ? 'bold' : 'normal', color: searchMode === m.val ? '#0056b3' : '#495057', cursor: 'pointer' }}
                 >
                   {m.lbl}
                 </button>
              ))}
            </div>
          )}

          {currentGroup === 'els' && (
            <div style={{ display: 'flex', marginTop: '12px', backgroundColor: '#e9ecef', borderRadius: '6px', padding: '4px' }}>
               <button onClick={() => setElsSubMode('auto')} style={{ flex: 1, border: 'none', background: elsSubMode === 'auto' ? '#fff' : 'transparent', borderRadius: '4px', padding: '6px', fontSize: '11px', fontWeight: 'bold', color: elsSubMode === 'auto' ? '#0056b3' : '#495057', cursor: 'pointer' }}>{t('autoDiscover') || "Auto-Discover"}</button>
               <button onClick={() => setElsSubMode('manual')} style={{ flex: 1, border: 'none', background: elsSubMode === 'manual' ? '#fff' : 'transparent', borderRadius: '4px', padding: '6px', fontSize: '11px', fontWeight: 'bold', color: elsSubMode === 'manual' ? '#0056b3' : '#495057', cursor: 'pointer' }}>{t('manualExplorer') || "Manual Explorer"}</button>
            </div>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid #e9ecef', margin: '20px 0' }} />

          {searchMode === 'els' && elsSubMode === 'manual' ? (
            <div>
              <label style={sectionLabelStyle}>{t('startPoint') || "Select Start Point"}</label>

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
                 {verseText ? renderPickerVerse() : "..."}
              </div>
              <div style={{ fontSize: '10px', color: '#6c757d', marginTop: '5px', textAlign: 'center' }}>
                {t('clickLetterToLock') || "Click a letter above to lock exact starting coordinate."}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold' }}>{t('jumpSize') || "Jump Size"}</label>
                  <input type="number" value={manualConfig.skip} onChange={e => setManualConfig({...manualConfig, skip: Number(e.target.value)})} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ced4da', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold' }}>{t('jumpCount') || "Jump Count"}</label>
                  <input type="number" value={manualConfig.count} onChange={e => setManualConfig({...manualConfig, count: Number(e.target.value)})} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ced4da', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={sectionLabelStyle}>{getInputTitle()}</label>
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('egSearch')} dir="rtl" style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          )}
        </div>

        {!(searchMode === 'els' && elsSubMode === 'manual') && (
          <div className="sidebar-content">
            <div className="input-group">
              <label style={{...sectionLabelStyle, marginTop: '10px'}}>{t('comparisonScopes') || "Search Boundaries"}</label>
              {ranges.map((range, index) => {
                const book = booksList.find(b => b.id === range.bookId);
                return (
                  <div key={range.id} className="range-card">
                    <div className="range-header">
                      <span style={{ fontWeight: 'bold', color: '#adb5bd' }}>{index + 1}.</span>
                      <select value={range.bookId} onChange={(e) => updateBook(range.id, e.target.value)} className="range-select">
                        {booksList.map(b => <option key={b.id} value={b.id}>{lang === 'he' ? b.he : (lang === 'fa' ? b.fa : b.name.replace('_', ' '))}</option>)}
                      </select>
                      <button onClick={() => removeRange(range.id)} disabled={ranges.length === 1 || loading} className="btn btn-delete">X</button>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="btn btn-edit-chapters" onClick={() => toggleAccordion(range.id)}>
                        {range.isExpanded ? t('hideChapters') : (t('chEdit') ? t('chEdit')(range.selectedChapters.length, book.maxCh) : `Chs: ${range.selectedChapters.length}/${book.maxCh}`)}
                      </button>
                    </div>
                    {range.isExpanded && (
                      <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #dee2e6' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{lang === 'he' ? book.he : book.name.replace('_', ' ')} {t('chapters')}</span>
                          <div style={{ fontSize: '12px' }}>
                            <a style={{cursor: 'pointer', color: '#0056b3'}} onClick={() => handleChapterSelection(range.id, book.maxCh, 'all')}>{t('all')}</a> |
                            <a style={{cursor: 'pointer', color: '#0056b3', margin: '0 5px'}} onClick={() => handleChapterSelection(range.id, book.maxCh, 'none')}>{t('none')}</a>
                          </div>
                        </div>
                        <div className="chapter-grid">
                          {Array.from({length: book.maxCh}, (_, i) => i + 1).map(ch => (
                            <button key={ch} className={`chapter-btn ${range.selectedChapters.includes(ch) ? 'selected' : ''}`} onClick={() => handleChapterSelection(range.id, book.maxCh, 'toggle', ch)}>
                              {numberToHebrew(ch)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <button onClick={addRange} disabled={loading} className="btn btn-add">{t('addRange') || "+ Add Range"}</button>
            </div>
          </div>
        )}

        <div className="sidebar-footer">
          <button onClick={handleSearch} disabled={loading} className="btn btn-run">
            {loading ? (t('processing') || "Processing...") : (t('runAnalysis') || "Run Analysis")}
          </button>
        </div>
      </aside>
    </>
  );
}

export default ControlSidebar;