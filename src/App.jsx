import { useState, useEffect, useRef } from 'react';
import logoIcon from './assets/OROT_ICON.png';
import './App.css';

import { translations } from './translations';
import { booksList, calculateGematria, COLORS } from './data/constants';
import VersePreview from './components/VersePreview';
import ChartDisplay from './components/ChartDisplay';
import ControlSidebar from './components/ControlSidebar';
import ELSFeedView from './components/ELSFeedView';
import ScopeSelectorOverlay from './components/ScopeSelectorOverlay';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: 'https://flagcdn.com/us.svg' },
  { code: 'he', label: 'עברית', flag: 'https://flagcdn.com/il.svg' },
  { code: 'fa', label: 'فارسی', flag: 'https://flagcdn.com/ir.svg' }
];

function App() {
  const [lang, setLang] = useState('he');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const t = (key) => (translations[lang] && translations[lang][key]) || key;
  const isRTL = lang === 'he' || lang === 'fa';

  const workerRef = useRef(null);
  const previewRef = useRef(null);
  const langMenuRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [appError, setAppError] = useState(null);
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [isScopeOpen, setIsScopeOpen] = useState(false);
  const [returnToMobileSearch, setReturnToMobileSearch] = useState(false);

  const [ranges, setRanges] = useState([{ id: Date.now(), bookId: '01', selectedChapters: Array.from({length: 50}, (_, i) => i + 1), isExpanded: false }]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState('exact');
  const [viewMode, setViewMode] = useState('absolute');

  // elsSubMode supports: 'auto' | 'anchor' | 'manual'
  const [elsSubMode, setElsSubMode] = useState('auto');
  const [includeSpaces, setIncludeSpaces] = useState(false);
  const [manualConfig, setManualConfig] = useState({ bookId: '01', chapter: 1, verse: 1, letterIdx: null, skip: 50, count: 10 });
  const [anchorConfig, setAnchorConfig] = useState({ bookId: '01', chapter: 1, verse: 1, letterIdx: null });

  const [resultTotals, setResultTotals] = useState(null);
  const [rawChartData, setRawChartData] = useState([]);
  const [activeTerms, setActiveTerms] = useState([]);
  const [activePreview, setActivePreview] = useState(null);

  const [isElsMode, setIsElsMode] = useState(false);
  const [elsData, setElsData] = useState(null);

  const currentLanguage = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const clearResults = () => {
    setElsData(null);
    setRawChartData([]);
    setResultTotals(null);
    setActivePreview(null);
  };

  // Smoothly scroll to the verse preview panel whenever a bar is clicked
  useEffect(() => {
    if (activePreview && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activePreview]);

  const handleOpenScope = () => {
    if (showMobilePanel) {
      setReturnToMobileSearch(true);
      setShowMobilePanel(false);
    }
    setIsScopeOpen(true);
  };

  const handleCloseScope = () => {
    setIsScopeOpen(false);
    if (returnToMobileSearch) {
      setShowMobilePanel(true);
      setReturnToMobileSearch(false);
    }
  };

  // Close scope overlay automatically if user enters Manual or Anchored ELS modes
  useEffect(() => {
    if (searchMode === 'els' && (elsSubMode === 'manual' || elsSubMode === 'anchor')) {
      setIsScopeOpen(false);
      setReturnToMobileSearch(false);
    }
  }, [searchMode, elsSubMode]);

  useEffect(() => {
    workerRef.current = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    workerRef.current.onmessage = (e) => {
      const { status, isEls, chartData, totals, elsData: resEls, errorCode, errorParams, error } = e.data;
      if (status === 'success') {
        if (isEls) {
          setIsElsMode(true);
          setElsData(resEls);
        } else {
          setIsElsMode(false);
          setRawChartData(chartData);
          setResultTotals(totals);
        }
      } else {
        clearResults();
        setAppError({ code: errorCode || 'ERR_GENERIC', params: errorParams || {}, raw: error });
        console.error("Worker failed:", error);
      }
      setLoading(false);
    };
    return () => workerRef.current.terminate();
  }, []);

  const renderErrorText = (errObj) => {
    if (!errObj) return null;
    const dict = translations[lang] || translations.en;
    switch (errObj.code) {
      case 'ERR_SELECT_CHAPTER':
        return dict.errorSelectChapter;
      case 'ERR_SELECT_LETTER':
        return dict.errorSelectLetter;
      case 'ERR_EMPTY_INPUT':
        return dict.errorEmptyInput;
      case 'ERR_START_NOT_FOUND':
        return dict.errStartNotFound;
      case 'ERR_ANCHOR_NOT_FOUND':
        return dict.errAnchorNotFound;
      case 'ERR_ANCHOR_MISMATCH':
        return typeof dict.errAnchorMismatch === 'function'
          ? dict.errAnchorMismatch(errObj.params.actual, errObj.params.term, errObj.params.expected)
          : errObj.raw;
      default:
        return errObj.raw || "An error occurred.";
    }
  };

  const handleSearch = () => {
    setAppError(null);
    setIsScopeOpen(false);
    setReturnToMobileSearch(false);
    clearResults();

    if (searchMode === 'els' && elsSubMode === 'manual') {
      if (manualConfig.letterIdx === null) {
        setAppError({ code: 'ERR_SELECT_LETTER' });
        return;
      }
      setLoading(true);
      setShowMobilePanel(false);
      workerRef.current.postMessage({ ranges, terms: [], searchMode, booksList, lang, chsStr: t('chsAbbr') || 'Chs', elsSubMode, manualConfig, includeSpaces });
      return;
    }

    if (searchMode === 'els' && elsSubMode === 'anchor') {
      if (anchorConfig.letterIdx === null) {
        setAppError({ code: 'ERR_SELECT_LETTER' });
        return;
      }
    }

    let rawTerms = searchTerm.split(',').map(term => term.trim()).filter(term => term.length > 0);
    let terms = [...new Set(rawTerms)];

    if (searchMode === 'els') {
      if (terms.length === 0) {
        setIsElsMode(false);
        setAppError({ code: 'ERR_EMPTY_INPUT' });
        return;
      }
      if (elsSubMode === 'auto' && (ranges.length === 0 || ranges.some(r => r.selectedChapters.length === 0))) {
        setAppError({ code: 'ERR_SELECT_CHAPTER' });
        return;
      }
      setLoading(true);
      setShowMobilePanel(false);
      workerRef.current.postMessage({ ranges, terms, searchMode, booksList, lang, chsStr: t('chsAbbr') || 'Chs', elsSubMode, includeSpaces, anchorConfig });
      return;
    }

    if (terms.length === 0) {
      setActiveTerms([]);
      setAppError({ code: 'ERR_EMPTY_INPUT' });
      return;
    }

    if (searchMode === 'gematria') {
      terms = terms.map(term => /^\d+$/.test(term) ? term : calculateGematria(term).toString());
    }

    if (ranges.length === 0 || ranges.some(r => r.selectedChapters.length === 0)) {
       setAppError({ code: 'ERR_SELECT_CHAPTER' });
       return;
    }

    setLoading(true);
    setActiveTerms(terms);
    setShowMobilePanel(false);
    workerRef.current.postMessage({ ranges, terms, searchMode, booksList, lang, chsStr: t('chsAbbr') || 'Chs', elsSubMode, includeSpaces });
  };

  const formatChapterRanges = (chapters, maxCh) => {
    if (!chapters || chapters.length === 0) return "None";
    if (maxCh && chapters.length === maxCh) return `1-${maxCh} (All)`;
    const sorted = [...chapters].sort((a, b) => a - b);
    const rangesArr = [];
    let start = sorted[0], prev = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === prev + 1) { prev = sorted[i]; }
      else { rangesArr.push(start === prev ? `${start}` : `${start}-${prev}`); start = sorted[i]; prev = sorted[i]; }
    }
    rangesArr.push(start === prev ? `${start}` : `${start}-${prev}`);
    return rangesArr.join(', ');
  };

  const handleExportCSV = () => {
    if (!rawChartData || rawChartData.length === 0) return;
    const BOM = '\uFEFF';
    let csvString = ["Scope", "Chapters", "Total Words", ...activeTerms].join(",") + "\n";
    rawChartData.forEach((row, index) => {
      const rangeObj = ranges[index];
      const bookObj = rangeObj ? booksList.find(b => b.id === rangeObj.bookId) : null;
      const chaptersFormatted = rangeObj ? formatChapterRanges(rangeObj.selectedChapters, bookObj?.maxCh) : "";
      csvString += [ `"${row.name}"`, `"${chaptersFormatted}"`, row.rangeTotalWords, ...activeTerms.map(t => row[t] || 0) ].join(",") + "\n";
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' }));
    link.download = "hebrew_stats.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderChartData = rawChartData.map(data => {
    if (viewMode === 'absolute') return data;
    const denominator = searchMode === 'letter' ? data.rangeTotalChars : data.rangeTotalWords;
    const mappedData = { name: data.name, verses: data.verses };
    activeTerms.forEach(term => { mappedData[term] = denominator > 0 ? Number(((data[term] / denominator) * 100).toFixed(3)) : 0; });
    return mappedData;
  });
  const minComfortableWidth = 100 + (renderChartData.length * activeTerms.length * 40);

  return (
    <div className="app-container" dir={isRTL ? 'rtl' : 'ltr'}>
      <header
        className="top-navbar"
        dir="ltr"
        style={{
          direction: 'ltr',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        {/* Always Left-Aligned Brand */}
        <div
          className="top-navbar-brand"
          style={{
            display: 'flex',
            alignItems: 'center',
            direction: 'ltr'
          }}
        >
          <img src={logoIcon} alt="Orot Logo" className="top-navbar-logo" />
          <h1 className="top-navbar-title" style={{ textAlign: 'left', margin: 0 }}>OROT</h1>
        </div>

        {/* Single-Flag Language Switcher Dropdown */}
        <div ref={langMenuRef} style={{ position: 'relative', display: 'inline-block' }}>
          <button
            type="button"
            onClick={() => setIsLangMenuOpen(prev => !prev)}
            aria-label="Select language"
            aria-expanded={isLangMenuOpen}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '6px 10px',
              backgroundColor: isLangMenuOpen ? '#e7f1ff' : '#f8fafc',
              border: isLangMenuOpen ? '1px solid #0056b3' : '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <img
              src={currentLanguage.flag}
              alt={currentLanguage.label}
              style={{
                width: '24px',
                height: '17px',
                objectFit: 'cover',
                borderRadius: '3px',
                border: '1px solid rgba(0, 0, 0, 0.15)',
                display: 'block'
              }}
            />
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#475569"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: isLangMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s ease'
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {isLangMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                minWidth: '148px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                boxShadow: '0 10px 25px rgba(15, 23, 42, 0.14)',
                padding: '5px',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}
            >
              {LANGUAGES.map((item) => {
                const isSelected = item.code === lang;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setLang(item.code);
                      setIsLangMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      width: '100%',
                      padding: '8px 10px',
                      border: 'none',
                      borderRadius: '7px',
                      backgroundColor: isSelected ? '#e7f1ff' : 'transparent',
                      color: isSelected ? '#0056b3' : '#1e293b',
                      fontSize: '13px',
                      fontWeight: isSelected ? '700' : '500',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.12s'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <img
                        src={item.flag}
                        alt={item.label}
                        style={{
                          width: '22px',
                          height: '15px',
                          objectFit: 'cover',
                          borderRadius: '2px',
                          border: '1px solid rgba(0, 0, 0, 0.15)',
                          flexShrink: 0
                        }}
                      />
                      <span>{item.label}</span>
                    </span>
                    {isSelected && (
                      <span style={{ fontSize: '12px', color: '#0056b3', fontWeight: 'bold' }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      <div className="app-layout">
        <main className="main-canvas" style={{ position: 'relative' }}>
          <ScopeSelectorOverlay
            isOpen={isScopeOpen}
            onClose={handleCloseScope}
            ranges={ranges}
            setRanges={setRanges}
            t={t}
            lang={lang}
          />

          {appError && (
            <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '15px 20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ffeeba', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <span style={{ fontWeight: 'bold' }}>{renderErrorText(appError)}</span>
              <button onClick={() => setAppError(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#856404' }}>✖</button>
            </div>
          )}

          {searchMode === 'els' || isElsMode ? (
            <ELSFeedView elsData={elsData} loading={loading} t={t} lang={lang} />
          ) : (
            <>
              <ChartDisplay
                resultTotals={resultTotals}
                loading={loading}
                activeTerms={activeTerms}
                searchMode={searchMode}
                viewMode={viewMode}
                setViewMode={setViewMode}
                handleExportCSV={handleExportCSV}
                minComfortableWidth={minComfortableWidth}
                renderChartData={renderChartData}
                activePreview={activePreview}
                setActivePreview={setActivePreview}
                t={t}
              />
              <div ref={previewRef}>
                <VersePreview activePreview={activePreview} setActivePreview={setActivePreview} activeTerms={activeTerms} COLORS={COLORS} t={t} />
              </div>
            </>
          )}
        </main>

        <ControlSidebar
          showMobilePanel={showMobilePanel} setShowMobilePanel={setShowMobilePanel}
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          searchMode={searchMode} setSearchMode={setSearchMode}
          ranges={ranges} loading={loading}
          isScopeOpen={isScopeOpen}
          onOpenScope={handleOpenScope}
          onCloseScope={handleCloseScope}
          handleSearch={handleSearch}
          t={t} lang={lang}
          elsSubMode={elsSubMode} setElsSubMode={setElsSubMode}
          manualConfig={manualConfig} setManualConfig={setManualConfig}
          includeSpaces={includeSpaces} setIncludeSpaces={setIncludeSpaces}
          anchorConfig={anchorConfig} setAnchorConfig={setAnchorConfig}
        />
      </div>
    </div>
  );
}

export default App;