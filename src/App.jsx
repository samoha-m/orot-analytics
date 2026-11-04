import { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, LabelList, ResponsiveContainer } from 'recharts';
import logoIcon from './assets/OROT_ICON.jpg';
import './App.css';

import { booksList, calculateGematria, numberToHebrew, COLORS } from './data/constants';

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
      r.id === id
        ? { ...r, isExpanded: !r.isExpanded }
        : { ...r, isExpanded: false }
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

  const renderHighlightedText = (text, highlights) => {
    if (!highlights || highlights.length === 0) return { __html: text };
    const pattern = new RegExp(`(${[...new Set(highlights)].sort((a,b) => b.length - a.length).map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
    return { __html: text.replace(pattern, '<mark class="highlight-match">$1</mark>') };
  };

  const minComfortableWidth = 100 + (renderChartData.length * activeTerms.length * 40);

  const sectionLabelStyle = {
    display: 'block',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#6c757d',
    fontWeight: 'bold',
    marginBottom: '8px'
  };

  return (
    <div className="app-layout">

      {/* LEFT: MAIN CANVAS (Chart & Results) */}
      <main className="main-canvas">
        {!resultTotals && !loading && (
          <div style={{ textAlign: 'center', marginTop: '100px', color: '#6c757d' }}>
            <h2>Ready to analyze Hebrew Text</h2>
            <p>Use the control panel to start your search.</p>
          </div>
        )}

        {loading && <h3 style={{color: '#0056b3'}}>Analyzing dataset... please wait.</h3>}

        {resultTotals && !loading && (
          <>
            <div className="chart-header">
              <div className="results-grid">
                {activeTerms.map((term, index) => (
                  <div key={term} className="result-badge">
                    <span style={{ color: COLORS[index % COLORS.length] }}>■ </span>
                    <strong>{term}</strong>: {resultTotals[term]} hits
                    {searchMode !== 'gematria' && ` (Gem: ${calculateGematria(term)})`}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="segmented-control" style={{ background: '#f8f9fa', border: '1px solid #dee2e6' }}>
                  <label className={`segment-btn ${viewMode === 'absolute' ? 'active' : ''}`}>
                    <input type="radio" checked={viewMode === 'absolute'} onChange={() => setViewMode('absolute')} /> Absolute
                  </label>
                  <label className={`segment-btn ${viewMode === 'relative' ? 'active' : ''}`}>
                    <input type="radio" checked={viewMode === 'relative'} onChange={() => setViewMode('relative')} /> Relative %
                  </label>
                </div>
                <button onClick={handleExportCSV} className="btn btn-export">CSV</button>
              </div>
            </div>

            <div className="chart-container" style={{ width: '100%', overflowX: 'auto', overflowY: 'hidden' }}>
              <div style={{ minWidth: `${minComfortableWidth}px`, width: '100%', height: '350px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={renderChartData} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke="#6c757d" angle={-15} textAnchor="end" height={60} tick={{fontSize: 12}} />
                    <YAxis stroke="#6c757d" allowDecimals={viewMode !== 'absolute'} tick={{fontSize: 12}} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} formatter={(value) => viewMode === 'relative' ? `${value}%` : value} />
                    <Legend verticalAlign="top" height={36}/>
                    {activeTerms.map((term, index) => (
                      <Bar
                        key={term}
                        dataKey={term}
                        fill={COLORS[index % COLORS.length]}
                        radius={[4, 4, 0, 0]}
                        onClick={(data) => setActivePreview({ name: data.name, verses: data.verses })}
                        cursor="pointer"
                        maxBarSize={45}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {activePreview && (
          <div className="preview-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#0056b3' }}>Preview: {activePreview.name}</h3>
              <button onClick={() => setActivePreview(null)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>✖</button>
            </div>

            {activeTerms.map((term, idx) => {
              const verses = activePreview.verses[term] || [];
              if (verses.length === 0) return null;
              return (
                <div key={term}>
                  <h4 style={{ color: COLORS[idx % COLORS.length], direction: 'rtl' }}>Matches for: {term} {verses.length === 100 && "(First 100)"}</h4>
                  {verses.map((v, i) => (
                    <div key={i} className="verse-item" style={{ borderRightColor: COLORS[idx % COLORS.length] }}>
                      <div className="verse-ref">{v.ref}</div>
                      <div className="verse-text" dangerouslySetInnerHTML={renderHighlightedText(v.text, v.highlights)} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MOBILE TOGGLE & OVERLAY */}
      <button className="mobile-trigger" onClick={() => setShowMobilePanel(true)}>🔍 Edit Search & Scopes</button>
      {showMobilePanel && <div className="mobile-overlay" onClick={() => setShowMobilePanel(false)}></div>}

      {/* RIGHT: CONTROL SIDEBAR */}
      <aside className={`control-sidebar ${showMobilePanel ? 'open' : ''}`}>

        {/* --- UNIFIED STICKY CONTROL DECK --- */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          backgroundColor: '#ffffff',
          padding: '20px',
          borderBottom: '1px solid #e9ecef',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>

          {/* 1. Logo Header */}
          <div style={{ display: 'flex', alignItems: 'center', textAlign: 'left', marginBottom: '20px' }}>
            <img
              src={logoIcon}
              alt="Orot Logo"
              style={{ width: '45px', height: '45px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginRight: '15px' }}
            />
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', lineHeight: '1', color: '#0056b3' }}>
                Orot <span style={{fontSize: '13px', fontWeight: 'normal', color: '#6c757d'}}>(אורות)</span>
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#adb5bd' }}>
                Hebrew Bible Text Analytics Engine
              </p>
            </div>
            <button className="mobile-close" onClick={() => setShowMobilePanel(false)} style={{ marginLeft: 'auto' }}>✖</button>
          </div>

          {/* 2. Search Input Bar */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={sectionLabelStyle}>Compare Terms (comma separated)</label>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg style={{ position: 'absolute', left: '12px', width: '16px', height: '16px', color: '#adb5bd' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="e.g. ויאמר אלהים"
                dir="rtl"
                className="search-input"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 35px',
                  borderRadius: '6px',
                  border: '1px solid #ced4da',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#0056b3';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 86, 179, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#ced4da';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Faint Divider */}
          <hr style={{ border: 'none', borderTop: '1px solid #e9ecef', margin: '20px 0' }} />

          {/* 3. Search Logic Mode */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={sectionLabelStyle}>Search Logic Mode</label>

            <div style={{ display: 'flex', borderRadius: '6px', border: '1px solid #ced4da', overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
              {[
                { val: 'exact', lbl: 'Exact', desc: 'Matches the exact phrase.' },
                { val: 'root', lbl: 'Root', desc: 'Finds base linguistic root.' },
                { val: 'letter', lbl: 'Letter', desc: 'Counts specific characters.' },
                { val: 'gematria', lbl: 'Gematria', desc: 'Matches numerical value.' }
              ].map((m, index) => (
                <label
                  key={m.val}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '8px 4px',
                    margin: 0,
                    cursor: 'pointer',
                    fontSize: '11.5px',
                    borderRight: index !== 3 ? '1px solid #ced4da' : 'none',
                    backgroundColor: searchMode === m.val ? '#0056b3' : 'transparent',
                    color: searchMode === m.val ? '#ffffff' : '#495057',
                    fontWeight: searchMode === m.val ? 'bold' : 'normal',
                    transition: 'background-color 0.2s, color 0.2s'
                  }}
                  title={m.desc}
                >
                  <input
                    type="radio"
                    name="searchMode"
                    value={m.val}
                    checked={searchMode === m.val}
                    onChange={(e) => setSearchMode(e.target.value)}
                    style={{ display: 'none' }}
                  />
                  <span>{m.lbl}</span>
                </label>
              ))}
            </div>
          </div>

        </div>
        {/* --- END STICKY DECK --- */}

        {/* --- SCROLLABLE CONTENT AREA --- */}
        <div className="sidebar-content" style={{ padding: '20px', paddingTop: '15px' }}>

          <div className="input-group">
            <label style={sectionLabelStyle}>Comparison Scopes</label>

            {ranges.map((range, index) => {
              const book = booksList.find(b => b.id === range.bookId);
              return (
                <div key={range.id} className="range-card">
                  <div className="range-header">
                    <span style={{ fontWeight: 'bold', color: '#adb5bd' }}>{index + 1}.</span>
                    <select value={range.bookId} onChange={(e) => updateBook(range.id, e.target.value)} className="range-select">
                      {booksList.map(b => <option key={b.id} value={b.id}>{b.name.replace('_', ' ')} ({b.he})</option>)}
                    </select>
                    <button onClick={() => removeRange(range.id)} disabled={ranges.length === 1 || loading} className="btn btn-delete">X</button>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-edit-chapters" onClick={() => toggleAccordion(range.id)}>
                      {range.isExpanded ? 'Hide Chapters' : `Ch: ${range.selectedChapters.length}/${book.maxCh} (Edit)`}
                    </button>
                  </div>

                  {range.isExpanded && (
                    <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #dee2e6' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{book.he} Chapters</span>
                        <div style={{ fontSize: '12px' }}>
                          <a style={{cursor: 'pointer', color: '#0056b3'}} onClick={() => handleChapterSelection(range.id, book.maxCh, 'all')}>All</a> |
                          <a style={{cursor: 'pointer', color: '#0056b3', marginLeft: '5px'}} onClick={() => handleChapterSelection(range.id, book.maxCh, 'none')}>None</a>
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
            <button onClick={addRange} disabled={loading} className="btn btn-add">+ Add Range to Compare</button>
          </div>
        </div>

        <div className="sidebar-footer">
          <button onClick={handleSearch} disabled={loading} className="btn btn-run">
            {loading ? 'Processing...' : 'Run Analysis'}
          </button>
        </div>
      </aside>
    </div>
  );
}

export default App;