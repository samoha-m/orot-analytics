import { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, LabelList, ResponsiveContainer } from 'recharts';
import './App.css';

import exactIcon from './assets/Exact_Phrase.jpg';
import rootIcon from './assets/Shoresh.jpg';
import letterIcon from './assets/Substring.jpg';
import gematriaIcon from './assets/Reverse_Gematria.jpg';

const booksList = [
  { id: '01', name: 'Genesis', he: 'בראשית', maxCh: 50 }, { id: '02', name: 'Exodus', he: 'שמות', maxCh: 40 },
  { id: '03', name: 'Leviticus', he: 'ויקרא', maxCh: 27 }, { id: '04', name: 'Numeri', he: 'במדבר', maxCh: 36 },
  { id: '05', name: 'Deuteronomium', he: 'דברים', maxCh: 34 }, { id: '06', name: 'Josua', he: 'יהושע', maxCh: 24 },
  { id: '07', name: 'Judices', he: 'שופטים', maxCh: 21 }, { id: '08', name: 'Samuel_I', he: 'שמואל א', maxCh: 31 },
  { id: '09', name: 'Samuel_II', he: 'שמואל ב', maxCh: 24 }, { id: '10', name: 'Reges_I', he: 'מלכים א', maxCh: 22 },
  { id: '11', name: 'Reges_II', he: 'מלכים ב', maxCh: 25 }, { id: '12', name: 'Jesaia', he: 'ישעיהו', maxCh: 66 },
  { id: '13', name: 'Jeremia', he: 'ירמיהו', maxCh: 52 }, { id: '14', name: 'Ezechiel', he: 'יחזקאל', maxCh: 48 },
  { id: '15', name: 'Hosea', he: 'הושע', maxCh: 14 }, { id: '16', name: 'Joel', he: 'יואל', maxCh: 4 },
  { id: '17', name: 'Amos', he: 'עמוס', maxCh: 9 }, { id: '18', name: 'Obadia', he: 'עובדיה', maxCh: 1 },
  { id: '19', name: 'Jona', he: 'יונה', maxCh: 4 }, { id: '20', name: 'Micha', he: 'מיכה', maxCh: 7 },
  { id: '21', name: 'Nahum', he: 'נחום', maxCh: 3 }, { id: '22', name: 'Habakuk', he: 'חבקוק', maxCh: 3 },
  { id: '23', name: 'Zephania', he: 'צפניה', maxCh: 3 }, { id: '24', name: 'Haggai', he: 'חגי', maxCh: 2 },
  { id: '25', name: 'Sacharia', he: 'זכריה', maxCh: 14 }, { id: '26', name: 'Maleachi', he: 'מלאכי', maxCh: 3 },
  { id: '27', name: 'Psalmi', he: 'תהילים', maxCh: 150 }, { id: '28', name: 'Iob', he: 'איוב', maxCh: 42 },
  { id: '29', name: 'Proverbia', he: 'משלי', maxCh: 31 }, { id: '30', name: 'Ruth', he: 'רות', maxCh: 4 },
  { id: '31', name: 'Canticum', he: 'שיר השירים', maxCh: 8 }, { id: '32', name: 'Ecclesiastes', he: 'קהלת', maxCh: 12 },
  { id: '33', name: 'Threni', he: 'איכה', maxCh: 5 }, { id: '34', name: 'Esther', he: 'אסתר', maxCh: 10 },
  { id: '35', name: 'Daniel', he: 'דניאל', maxCh: 12 }, { id: '36', name: 'Esra', he: 'עזרא', maxCh: 10 },
  { id: '37', name: 'Nehemia', he: 'נחמיה', maxCh: 13 }, { id: '38', name: 'Chronica_I', he: 'דברי הימים א', maxCh: 29 },
  { id: '39', name: 'Chronica_II', he: 'דברי הימים ב', maxCh: 36 }
];

const gematriaMap = { 'א':1, 'ב':2, 'ג':3, 'ד':4, 'ה':5, 'ו':6, 'ז':7, 'ח':8, 'ט':9, 'י':10, 'כ':20, 'ך':20, 'ל':30, 'מ':40, 'ם':40, 'נ':50, 'ן':50, 'ס':60, 'ע':70, 'פ':80, 'ף':80, 'צ':90, 'ץ':90, 'ק':100, 'ר':200, 'ש':300, 'ת':400 };
const calculateGematria = (word) => { let sum = 0; for (let i = 0; i < word.length; i++) { sum += gematriaMap[word[i]] || 0; } return sum; };
const numberToHebrew = (num) => { if (num === 0) return ''; let hebrew = ''; if (num >= 100) { hebrew += 'ק'; num -= 100; } if (num === 15) return hebrew + 'טו'; if (num === 16) return hebrew + 'טז'; const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ']; const units = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט']; hebrew += tens[Math.floor(num / 10)] + units[num % 10]; return hebrew; };
const COLORS = ['#0056b3', '#dc3545', '#28a745', '#ffc107', '#6f42c1'];

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
  const toggleAccordion = (id) => setRanges(ranges.map(r => r.id === id ? { ...r, isExpanded: !r.isExpanded } : r));

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
    const terms = searchTerm.split(',').map(term => term.trim()).filter(term => term.length > 0);
    if (terms.length === 0) return;
    if (ranges.some(r => r.selectedChapters.length === 0)) return alert("Please select at least one chapter for all ranges.");

    setLoading(true);
    setActiveTerms(terms);
    setActivePreview(null);
    setShowMobilePanel(false);
    workerRef.current.postMessage({ ranges, terms, searchMode, booksList });
  };

  const handleExportCSV = () => {
    if (!rawChartData || rawChartData.length === 0) return;
    const BOM = '\uFEFF';
    let csvString = ["Scope", "Total Words", ...activeTerms].join(",") + "\n";
    rawChartData.forEach(row => { csvString += [`"${row.name}"`, row.rangeTotalWords, ...activeTerms.map(t => row[t] || 0)].join(",") + "\n"; });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' }));
    link.download = "hebrew_stats.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
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

            <div className="chart-container">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={renderChartData} margin={{ top: 30, right: 30, left: 0, bottom: 25 }}>
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
                    >
                      <LabelList
                        dataKey={term}
                        position="top"
                        formatter={(value) => viewMode === 'relative' ? `${value}%` : value}
                        style={{ fill: '#495057', fontSize: '12px', fontWeight: 600 }}
                        offset={8}
                      />
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
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
        <div className="sidebar-header">
          <div>
            <h1 className="app-title">Orot <span style={{fontSize: '16px', fontWeight: 'normal', color: '#6c757d'}}></span></h1>
            <p className="app-subtitle">Hebrew Bible Text Analytics Engine</p>
          </div>
          <button className="mobile-close" onClick={() => setShowMobilePanel(false)}>✖</button>
        </div>

        <div className="sidebar-content">
          <div className="input-group">
            <label>Compare Terms (comma separated):</label>
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="e.g. ויאמר אלהים" dir="rtl" className="search-input" />
          </div>

          <div className="input-group">
            <label>Search Logic Mode:</label>
            <div className="segmented-control">
              {[
                { val: 'exact', lbl: 'Exact', img: exactIcon, desc: 'Matches the exact word or multi-word phrase precisely as typed.' },
                { val: 'root', lbl: 'Root', img: rootIcon, desc: 'Finds all occurrences derived from the same linguistic base root.' },
                { val: 'letter', lbl: 'Letter', img: letterIcon, desc: 'Counts every occurrence of specific characters or partial strings.' },
                { val: 'gematria', lbl: 'Gematria', img: gematriaIcon, desc: 'Finds words whose numerical value matches your input number.' }
              ].map(m => (
                <label key={m.val} className={`segment-btn ${searchMode === m.val ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="searchMode"
                    value={m.val}
                    checked={searchMode === m.val}
                    onChange={(e) => setSearchMode(e.target.value)}
                  />
                  <img src={m.img} alt={`${m.lbl} icon`} className="mode-icon" />
                  <span>{m.lbl}</span>
                  <div className="mode-tooltip">{m.desc}</div>
                </label>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label>Comparison Scopes:</label>
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