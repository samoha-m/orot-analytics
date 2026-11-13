import { useState, useEffect, useRef } from 'react';
import logoIcon from './assets/OROT_ICON.png';
import './App.css';

import { translations } from './translations';
import { booksList, calculateGematria, COLORS } from './data/constants';
import VersePreview from './components/VersePreview';
import ChartDisplay from './components/ChartDisplay';
import ControlSidebar from './components/ControlSidebar';
import ELSFeedView from './components/ELSFeedView';

function App() {
  const [lang, setLang] = useState('he');
  const t = (key) => (translations[lang] && translations[lang][key]) || key;
  const isRTL = lang === 'he' || lang === 'fa';

  const workerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [appError, setAppError] = useState(null); // NEW: Custom Error State
  const [showMobilePanel, setShowMobilePanel] = useState(false);

  const [ranges, setRanges] = useState([{ id: Date.now(), bookId: '01', selectedChapters: Array.from({length: 50}, (_, i) => i + 1), isExpanded: false }]);
  const [searchTerm, setSearchTerm] = useState('אור');
  const [searchMode, setSearchMode] = useState('exact');
  const [viewMode, setViewMode] = useState('absolute');

  const [elsSubMode, setElsSubMode] = useState('auto');
  const [manualConfig, setManualConfig] = useState({ bookId: '01', chapter: 1, verse: 1, letterIdx: null, skip: 50, count: 10 });

  const [resultTotals, setResultTotals] = useState(null);
  const [rawChartData, setRawChartData] = useState([]);
  const [activeTerms, setActiveTerms] = useState([]);
  const [activePreview, setActivePreview] = useState(null);

  const [isElsMode, setIsElsMode] = useState(false);
  const [elsData, setElsData] = useState(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    workerRef.current.onmessage = (e) => {
      const { status, isEls, chartData, totals, elsData: resEls, error } = e.data;
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
        setAppError(error);
        console.error("Worker failed:", error);
      }
      setLoading(false);
    };
    return () => workerRef.current.terminate();
  }, []);

  const addRange = () => setRanges([...ranges, { id: Date.now(), bookId: '01', selectedChapters: Array.from({length: 50}, (_, i) => i + 1), isExpanded: false }]);
  const removeRange = (id) => { if (ranges.length > 1) setRanges(ranges.filter(r => r.id !== id)); };

  const updateBook = (id, newBookId) => {
    const newBook = booksList.find(b => b.id === newBookId);
    setRanges(ranges.map(r => r.id === id ? { ...r, bookId: newBookId, selectedChapters: Array.from({length: newBook.maxCh}, (_, i) => i + 1), isExpanded: false } : r));
  };

  const toggleAccordion = (id) => {
    setRanges(ranges.map(r => r.id === id ? { ...r, isExpanded: !r.isExpanded } : { ...r, isExpanded: false }));
  };

  const handleChapterSelection = (id, maxCh, action, singleCh = null) => {
    setRanges(ranges.map(r => {
      if (r.id !== id) return r;
      if (action === 'all') return { ...r, selectedChapters: Array.from({length: maxCh}, (_, i) => i + 1) };
      if (action === 'none') return { ...r, selectedChapters: [] };
      if (action === 'toggle' && singleCh) {
        const exists = r.selectedChapters.includes(singleCh);
        return { ...r, selectedChapters: exists ? r.selectedChapters.filter(ch => ch !== singleCh) : [...r.selectedChapters, singleCh] };
      }
      return r;
    }));
  };

  const handleSearch = () => {
    setAppError(null);
    if (searchMode === 'els' && elsSubMode === 'manual') {
      if (manualConfig.letterIdx === null) {
        setAppError(t('errorSelectLetter'));
        return;
      }
      setLoading(true);
      setActivePreview(null);
      setShowMobilePanel(false);
      workerRef.current.postMessage({ ranges, terms: [], searchMode, booksList, lang, chsStr: t('chsAbbr') || 'Chs', elsSubMode, manualConfig });
      return;
    }

    if (!searchTerm) return;

    // FIX: Deduplicate terms using Set
    let rawTerms = searchTerm.split(',').map(term => term.trim()).filter(term => term.length > 0);
    let terms = [...new Set(rawTerms)];

    if (searchMode === 'gematria') {
      terms = terms.map(term => /^\d+$/.test(term) ? term : calculateGematria(term).toString());
    }
    if (terms.length === 0) return;
    if (ranges.some(r => r.selectedChapters.length === 0)) {
       setAppError(t('errorSelectChapter'));
       return;
    }

    setLoading(true);
    setActiveTerms(terms);
    setActivePreview(null);
    setShowMobilePanel(false);
    workerRef.current.postMessage({ ranges, terms, searchMode, booksList, lang, chsStr: t('chsAbbr') || 'Chs', elsSubMode });
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
      <header className="top-navbar">
        <div className="top-navbar-brand">
          <img src={logoIcon} alt="Orot Logo" className="top-navbar-logo" />
          <h1 className="top-navbar-title" style={{ textAlign: isRTL ? 'right' : 'left' }}>OROT</h1>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button onClick={() => setLang('en')} title="English" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: lang === 'en' ? 1 : 0.4, transform: lang === 'en' ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.2s', filter: lang === 'en' ? 'drop-shadow(0 3px 5px rgba(0,0,0,0.3))' : 'none' }}>
            <img src="https://flagcdn.com/us.svg" alt="English" style={{ width: '28px', height: '20px', objectFit: 'cover', borderRadius: '3px', border: '1px solid rgba(0,0,0,0.15)' }} />
          </button>
          <button onClick={() => setLang('he')} title="עברית" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: lang === 'he' ? 1 : 0.4, transform: lang === 'he' ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.2s', filter: lang === 'he' ? 'drop-shadow(0 3px 5px rgba(0,0,0,0.3))' : 'none' }}>
            <img src="https://flagcdn.com/il.svg" alt="Hebrew" style={{ width: '28px', height: '20px', objectFit: 'cover', borderRadius: '3px', border: '1px solid rgba(0,0,0,0.15)' }} />
          </button>
          <button onClick={() => setLang('fa')} title="فارسی" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: lang === 'fa' ? 1 : 0.4, transform: lang === 'fa' ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.2s', filter: lang === 'fa' ? 'drop-shadow(0 3px 5px rgba(0,0,0,0.3))' : 'none' }}>
            <img src="https://flagcdn.com/ir.svg" alt="Farsi" style={{ width: '28px', height: '20px', objectFit: 'cover', borderRadius: '3px', border: '1px solid rgba(0,0,0,0.15)' }} />
          </button>
        </div>
      </header>

      <div className="app-layout">
        <main className="main-canvas">
          {/* CUSTOM ERROR BANNER */}
          {appError && (
            <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '15px 20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ffeeba', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <span style={{ fontWeight: 'bold' }}>{appError}</span>
              <button onClick={() => setAppError(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#856404' }}>✖</button>
            </div>
          )}

          {searchMode === 'els' || isElsMode ? (
            <ELSFeedView elsData={elsData} loading={loading} t={t} lang={lang} />
          ) : (
            <>
              <ChartDisplay resultTotals={resultTotals} loading={loading} activeTerms={activeTerms} searchMode={searchMode} viewMode={viewMode} setViewMode={setViewMode} handleExportCSV={handleExportCSV} minComfortableWidth={minComfortableWidth} renderChartData={renderChartData} setActivePreview={setActivePreview} t={t} />
              <VersePreview activePreview={activePreview} setActivePreview={setActivePreview} activeTerms={activeTerms} COLORS={COLORS} t={t} />
            </>
          )}
        </main>

        <ControlSidebar
          showMobilePanel={showMobilePanel} setShowMobilePanel={setShowMobilePanel}
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          searchMode={searchMode} setSearchMode={setSearchMode}
          ranges={ranges} loading={loading}
          updateBook={updateBook} removeRange={removeRange} toggleAccordion={toggleAccordion} handleChapterSelection={handleChapterSelection} addRange={addRange} handleSearch={handleSearch}
          t={t} lang={lang}
          elsSubMode={elsSubMode} setElsSubMode={setElsSubMode}
          manualConfig={manualConfig} setManualConfig={setManualConfig}
        />
      </div>
    </div>
  );
}

export default App;