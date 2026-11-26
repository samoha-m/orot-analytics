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
import InfoModal from './components/InfoModal';
import LChaimModal from './components/LChaimModal';
import EmptyStateDashboard from './components/EmptyStateDashboard';
import HebrewMatrixLoader from './components/HebrewMatrixLoader';
import { useAndroidBackExit } from './hooks/useAndroidBackExit';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: 'https://flagcdn.com/us.svg' },
  { code: 'he', label: 'עברית', flag: 'https://flagcdn.com/il.svg' },
  { code: 'fa', label: 'فارسی', flag: 'https://flagcdn.com/ir.svg' }
];

function App() {
  const [lang, setLang] = useState('he');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isLChaimOpen, setIsLChaimOpen] = useState(false);
  const t = (key) => (translations[lang] && translations[lang][key]) || key;
  const isRTL = lang === 'he' || lang === 'fa';

  const workerRef = useRef(null);
  const previewRef = useRef(null);
  const langMenuRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [appError, setAppError] = useState(null);
  const [mobileView, setMobileView] = useState('search'); // 'search' | 'results'
  const [isScopeOpen, setIsScopeOpen] = useState(false);

  const [ranges, setRanges] = useState([{ id: Date.now(), bookId: '01', selectedChapters: Array.from({length: 50}, (_, i) => i + 1), isExpanded: false }]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState('exact');
  const [acronymPosition, setAcronymPosition] = useState('first'); // 'first' | 'last'
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
  const isSkipView = searchMode === 'els' || isElsMode;
  const hasActiveResults = isSkipView ? Boolean(elsData) : Boolean(resultTotals);

  // Android Back Button & Two-Tap Exit Handler
  const { ExitToast } = useAndroidBackExit({
    isInfoOpen,
    setIsInfoOpen,
    isScopeOpen,
    setIsScopeOpen,
    isLangMenuOpen,
    setIsLangMenuOpen,
    mobileView,
    setMobileView,
    exitMessage: (translations[lang] && translations[lang].pressBackAgainToExit) || 'Press back again to exit',
    isRTL
  });

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

  // Logo click resets workspace back to the initial screen while preserving language
  const handleLogoReset = () => {
    setAppError(null);
    setIsScopeOpen(false);
    setIsInfoOpen(false);
    setIsLChaimOpen(false);
    setIsLangMenuOpen(false);
    setIsElsMode(false);
    setSearchMode('exact');
    setElsSubMode('auto');
    setSearchTerm('');
    setActiveTerms([]);
    clearResults();
    setMobileView('search');
  };

  // Smoothly scroll to the verse preview panel whenever a bar is clicked
  useEffect(() => {
    if (activePreview && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activePreview]);

  const handleOpenScope = () => {
    setIsScopeOpen(true);
  };

  const handleCloseScope = () => {
    setIsScopeOpen(false);
  };

  // Close scope overlay automatically if user enters Manual or Anchored ELS modes
  useEffect(() => {
    if (searchMode === 'els' && (elsSubMode === 'manual' || elsSubMode === 'anchor')) {
      setIsScopeOpen(false);
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

  const handleSearch = (overrides = {}) => {
    const effectiveAcronymPos = overrides.acronymPosition ?? acronymPosition;

    // Dismiss mobile virtual keyboard cleanly
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    setAppError(null);
    setIsScopeOpen(false);
    clearResults();

    if (searchMode === 'els' && elsSubMode === 'manual') {
      if (manualConfig.letterIdx === null) {
        setAppError({ code: 'ERR_SELECT_LETTER' });
        return;
      }
      setLoading(true);
      setMobileView('results');
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
      setMobileView('results');
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
    setMobileView('results');
    workerRef.current.postMessage({
      ranges,
      terms,
      searchMode,
      booksList,
      lang,
      chsStr: t('chsAbbr') || 'Chs',
      elsSubMode,
      includeSpaces,
      acronymPosition: effectiveAcronymPos
    });
  };

  // One-click runner for Curated Spotlight Carousel examples
  const handleRunExample = (example) => {
    if (!example) return;

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    setAppError(null);
    setIsScopeOpen(false);
    clearResults();

    const nextMode = example.searchMode || 'exact';
    const nextElsSubMode = example.elsSubMode || 'auto';
    const nextAcronymPos = example.acronymPosition || 'first';
    const nextTerm = example.searchTerm || '';

    const targetIds =
      Array.isArray(example.bookIds) && example.bookIds.length > 0
        ? example.bookIds
        : ['01'];

    const nextRanges = targetIds.map((id, idx) => {
      const bookObj = booksList.find((b) => b.id === id) || booksList[0];
      return {
        id: Date.now() + idx,
        bookId: bookObj.id,
        selectedChapters: Array.from({ length: bookObj.maxCh }, (_, i) => i + 1),
        isExpanded: false
      };
    });

    setSearchMode(nextMode);
    setIsElsMode(nextMode === 'els');
    setElsSubMode(nextElsSubMode);
    setIncludeSpaces(false);
    setAcronymPosition(nextAcronymPos);
    setSearchTerm(nextTerm);
    setRanges(nextRanges);
    setLoading(true);
    setMobileView('results');

    if (nextMode === 'els') {
      const terms = [nextTerm.trim()];
      workerRef.current.postMessage({
        ranges: nextRanges,
        terms,
        searchMode: 'els',
        booksList,
        lang,
        chsStr: t('chsAbbr') || 'Chs',
        elsSubMode: nextElsSubMode,
        includeSpaces: false,
        anchorConfig
      });
      return;
    }

    let rawTerms = nextTerm
      .split(',')
      .map((term) => term.trim())
      .filter((term) => term.length > 0);
    let terms = [...new Set(rawTerms)];

    if (nextMode === 'gematria') {
      terms = terms.map((term) =>
        /^\d+$/.test(term) ? term : calculateGematria(term).toString()
      );
    }

    setActiveTerms(terms);
    workerRef.current.postMessage({
      ranges: nextRanges,
      terms,
      searchMode: nextMode,
      booksList,
      lang,
      chsStr: t('chsAbbr') || 'Chs',
      elsSubMode: 'auto',
      includeSpaces: false,
      acronymPosition: nextAcronymPos
    });
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
        {/* Left-Aligned Logo Icon Only (Click to Reset to Initial Screen) */}
        <div
          className="top-navbar-brand"
          role="button"
          tabIndex={0}
          onClick={handleLogoReset}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleLogoReset();
          }}
          title="OROT - Reset"
          style={{
            display: 'flex',
            alignItems: 'center',
            direction: 'ltr'
          }}
        >
          <img src={logoIcon} alt="Orot Logo" className="top-navbar-logo" />
        </div>

        {/* Right Controls: Pour a L'Chaim + Info (i) Button + Single-Flag Language Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            dir={isRTL ? 'rtl' : 'ltr'}
            onClick={() => setIsLChaimOpen(true)}
            aria-label={t('lchaimBtn') || "Pour a L'Chaim"}
            title={t('lchaimBtn') || "Pour a L'Chaim"}
            className="hover-lift lchaim-nav-btn"
            style={{
              height: '34px',
              padding: '0 12px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              backgroundColor: isLChaimOpen
                ? 'rgba(251, 191, 36, 0.2)'
                : 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.48)',
              borderRadius: '999px',
              color: '#fde68a',
              fontSize: '12px',
              fontWeight: '700',
              boxShadow: '0 0 14px -3px rgba(251, 191, 36, 0.28)',
              cursor: 'pointer'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 22h8" />
              <path d="M12 15v7" />
              <path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z" />
            </svg>
            <span className="lchaim-btn-label">{t('lchaimBtn') || "Pour a L'Chaim"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsInfoOpen(true)}
            aria-label={t('infoTitle') || "About OROT"}
            title={t('infoTitle') || "About OROT"}
            className="hover-lift"
            style={{
              width: '34px',
              height: '34px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isInfoOpen ? 'rgba(56, 189, 248, 0.16)' : 'rgba(15, 23, 42, 0.75)',
              border: isInfoOpen ? '1px solid rgba(56, 189, 248, 0.75)' : '1px solid rgba(51, 65, 85, 0.85)',
              borderRadius: '999px',
              color: isInfoOpen ? '#7dd3fc' : '#94a3b8',
              boxShadow: isInfoOpen ? '0 0 12px rgba(56, 189, 248, 0.3)' : 'none',
              cursor: 'pointer'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>

          <div ref={langMenuRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
              type="button"
              onClick={() => setIsLangMenuOpen(prev => !prev)}
              aria-label="Select language"
              aria-expanded={isLangMenuOpen}
              className="hover-lift"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                height: '34px',
                padding: '0 10px',
                backgroundColor: isLangMenuOpen ? 'rgba(56, 189, 248, 0.16)' : 'rgba(15, 23, 42, 0.75)',
                border: isLangMenuOpen ? '1px solid rgba(56, 189, 248, 0.75)' : '1px solid rgba(51, 65, 85, 0.85)',
                borderRadius: '999px',
                boxShadow: isLangMenuOpen ? '0 0 12px rgba(56, 189, 248, 0.3)' : 'none',
                cursor: 'pointer'
              }}
            >
              <img
                src={currentLanguage.flag}
                alt={currentLanguage.label}
                style={{
                  width: '22px',
                  height: '15px',
                  objectFit: 'cover',
                  borderRadius: '3px',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  display: 'block'
                }}
              />
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2.4"
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
                  top: 'calc(100% + 8px)',
                  right: 0,
                  minWidth: '150px',
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '12px',
                  boxShadow: '0 14px 32px rgba(0, 0, 0, 0.65)',
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
                        borderRadius: '8px',
                        backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.16)' : 'transparent',
                        color: isSelected ? '#7dd3fc' : '#cbd5e1',
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
                            border: '1px solid rgba(255, 255, 255, 0.18)',
                            flexShrink: 0
                          }}
                        />
                        <span>{item.label}</span>
                      </span>
                      {isSelected && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* dir="ltr" keeps ControlSidebar permanently on the left on Desktop Web across all languages */}
      <div className="app-layout" dir="ltr">
        {/* Shared Error Toast Banner */}
        {appError && (
          <div
            dir={isRTL ? 'rtl' : 'ltr'}
            style={{
              position: 'absolute',
              top: '12px',
              left: '16px',
              right: '16px',
              zIndex: 35,
              backgroundColor: 'rgba(120, 53, 15, 0.94)',
              backdropFilter: 'blur(8px)',
              color: '#fef3c7',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(251, 191, 36, 0.65)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)'
            }}
          >
            <span style={{ fontWeight: '700', fontSize: '13px' }}>{renderErrorText(appError)}</span>
            <button
              onClick={() => setAppError(null)}
              aria-label="Dismiss error"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#fde68a',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
                flexShrink: 0
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Full-Screen Scope Selector Overlay */}
        <ScopeSelectorOverlay
          isOpen={isScopeOpen}
          onClose={handleCloseScope}
          ranges={ranges}
          setRanges={setRanges}
          t={t}
          lang={lang}
        />

        {/* Info Guide Modal */}
        <InfoModal
          isOpen={isInfoOpen}
          onClose={() => setIsInfoOpen(false)}
          t={t}
          lang={lang}
        />

        {/* Pour a L'Chaim Support Modal */}
        <LChaimModal
          isOpen={isLChaimOpen}
          onClose={() => setIsLChaimOpen(false)}
          lang={lang}
        />

        {/* Left-Pinned Search & Control Sidebar */}
        <ControlSidebar
          mobileView={mobileView}
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          searchMode={searchMode} setSearchMode={setSearchMode}
          acronymPosition={acronymPosition} setAcronymPosition={setAcronymPosition}
          ranges={ranges} loading={loading}
          isScopeOpen={isScopeOpen}
          onOpenScope={handleOpenScope}
          onCloseScope={handleCloseScope}
          handleSearch={handleSearch}
          onRunExample={handleRunExample}
          t={t} lang={lang}
          elsSubMode={elsSubMode} setElsSubMode={setElsSubMode}
          manualConfig={manualConfig} setManualConfig={setManualConfig}
          includeSpaces={includeSpaces} setIncludeSpaces={setIncludeSpaces}
          anchorConfig={anchorConfig} setAnchorConfig={setAnchorConfig}
        />

        {/* Right-Side Workspace Canvas */}
        <main
          dir={isRTL ? 'rtl' : 'ltr'}
          className={`main-canvas ${mobileView === 'results' ? 'mobile-active' : 'mobile-hidden'}`}
          style={{ position: 'relative' }}
        >
          {/* Mobile Back-to-Search Header Strip */}
          <div className="mobile-back-bar">
            <button
              type="button"
              className="mobile-back-btn"
              onClick={() => {
                setAppError(null);
                setMobileView('search');
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
                style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }}
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>{t('backToSearch') || "Back to Search"}</span>
            </button>
          </div>

          {loading ? (
            <HebrewMatrixLoader message={t('analyzingDataset')} />
          ) : !hasActiveResults ? (
            <EmptyStateDashboard t={t} lang={lang} onRunExample={handleRunExample} />
          ) : isSkipView ? (
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
                lang={lang}
              />
              <div ref={previewRef}>
                <VersePreview
                  activePreview={activePreview}
                  setActivePreview={setActivePreview}
                  activeTerms={activeTerms}
                  COLORS={COLORS}
                  searchMode={searchMode}
                  acronymPosition={acronymPosition}
                  t={t}
                />
              </div>
            </>
          )}
        </main>
      </div>

      {/* Two-Tap Android Exit Toast */}
      {ExitToast}
    </div>
  );
}

export default App;