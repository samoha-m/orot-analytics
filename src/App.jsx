import { useState, useEffect, useRef } from 'react';
import './App.css';

import { booksList, calculateGematria, COLORS } from './data/constants';
import VersePreview from './components/VersePreview';
import ChartDisplay from './components/ChartDisplay';
import ControlSidebar from './components/ControlSidebar';

function App() {
  const workerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [showMobilePanel, setShowMobilePanel] = useState(false);

  const [ranges, setRanges] = useState([{ id: Date.now(), bookId: '01', selectedChapters: Array.from({length: 50}, (_, i) => i + 1), isExpanded: false }]);
  const [searchTerm, setSearchTerm] = useState('אור');
  const [searchMode, setSearchMode] = useState('exact');
  const [viewMode, setViewMode] = useState('absolute');
  const [resultTotals, setResultTotals] = useState(null);
  const [rawChartData, setRawChartData] = useState([]);
  const [activeTerms, setActiveTerms] = useState([]);
  const [activePreview, setActivePreview] = useState(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    workerRef.current.onmessage = (e) => {
      const { status, chartData, totals, error } = e.data;
      if (status === 'success') { setRawChartData(chartData); setResultTotals(totals); }
      else { console.error("Worker failed:", error); }
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
    setRanges(ranges.map(r =>
      r.id === id ? { ...r, isExpanded: !r.isExpanded } : { ...r, isExpanded: false }
    ));
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
    if (!searchTerm) return;
    let terms = searchTerm.split(',').map(term => term.trim()).filter(term => term.length > 0);

    if (searchMode === 'gematria') {
      terms = terms.map(term => {
        if (/^\d+$/.test(term)) return term;
        return calculateGematria(term).toString();
      });
    }

    if (terms.length === 0) return;
    if (ranges.some(r => r.selectedChapters.length === 0)) return alert("Please select at least one chapter for all ranges.");

    setLoading(true);
    setActiveTerms(terms);
    setActivePreview(null);
    setShowMobilePanel(false);
    workerRef.current.postMessage({ ranges, terms, searchMode, booksList });
  };

  const formatChapterRanges = (chapters, maxCh) => {
    if (!chapters || chapters.length === 0) return "None";
    if (maxCh && chapters.length === maxCh) return `1-${maxCh} (All)`;

    const sorted = [...chapters].sort((a, b) => a - b);
    const rangesArr = [];
    let start = sorted[0];
    let prev = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === prev + 1) {
        prev = sorted[i];
      } else {
        rangesArr.push(start === prev ? `${start}` : `${start}-${prev}`);
        start = sorted[i];
        prev = sorted[i];
      }
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

      csvString += [
        `"${row.name}"`,
        `"${chaptersFormatted}"`,
        row.rangeTotalWords,
        ...activeTerms.map(t => row[t] || 0)
      ].join(",") + "\n";
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
    activeTerms.forEach(t => { mappedData[t] = denominator > 0 ? Number(((data[t] / denominator) * 100).toFixed(3)) : 0; });
    return mappedData;
  });

  const minComfortableWidth = 100 + (renderChartData.length * activeTerms.length * 40);

  return (
    <div className="app-layout">
      <main className="main-canvas">
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
          setActivePreview={setActivePreview}
        />

        <VersePreview
          activePreview={activePreview}
          setActivePreview={setActivePreview}
          activeTerms={activeTerms}
          COLORS={COLORS}
        />
      </main>

      <ControlSidebar
        showMobilePanel={showMobilePanel}
        setShowMobilePanel={setShowMobilePanel}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchMode={searchMode}
        setSearchMode={setSearchMode}
        ranges={ranges}
        loading={loading}
        updateBook={updateBook}
        removeRange={removeRange}
        toggleAccordion={toggleAccordion}
        handleChapterSelection={handleChapterSelection}
        addRange={addRange}
        handleSearch={handleSearch}
      />
    </div>
  );
}

export default App;