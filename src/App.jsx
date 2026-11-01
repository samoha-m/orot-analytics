import { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, LabelList, ResponsiveContainer } from 'recharts';
import './App.css';

// 1. Import your custom icons
import exactIcon from './assets/Exact_Phrase.jpg';
import rootIcon from './assets/Shoresh.jpg';
import letterIcon from './assets/Substring.jpg';
import gematriaIcon from './assets/Reverse_Gematria.jpg';

// Define chart colors
const COLORS = ['#0056b3', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14'];

export default function App() {
  // App State
  const [searchMode, setSearchMode] = useState('exact');
  const [viewMode, setViewMode] = useState('absolute');
  const [searchInputs, setSearchInputs] = useState(['']);
  const [activeTerms, setActiveTerms] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [activePreview, setActivePreview] = useState(null);
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const workerRef = useRef(null);

  // Initialize Web Worker
  useEffect(() => {
    workerRef.current = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

    workerRef.current.onmessage = (e) => {
      const { type, data, error } = e.data;
      if (type === 'RESULTS') {
        setChartData(data.chartData);
        setActiveTerms(data.activeTerms);
        setIsProcessing(false);
      } else if (type === 'ERROR') {
        console.error('Worker Error:', error);
        setIsProcessing(false);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleRunAnalysis = () => {
    setIsProcessing(true);
    workerRef.current?.postMessage({
      type: 'ANALYZE',
      payload: {
        terms: searchInputs.filter(t => t.trim() !== ''),
        searchMode,
        viewMode
      }
    });
    // Close mobile panel automatically on run
    if (window.innerWidth <= 768) {
        setShowMobilePanel(false);
    }
  };

  const updateSearchInput = (index, value) => {
    const newInputs = [...searchInputs];
    newInputs[index] = value;
    setSearchInputs(newInputs);
  };

  const addSearchInput = () => setSearchInputs([...searchInputs, '']);
  const removeSearchInput = (index) => {
    const newInputs = searchInputs.filter((_, i) => i !== index);
    setSearchInputs(newInputs);
  };

  return (
    <div className="app-layout">
      {/* Mobile Overlay */}
      {showMobilePanel && <div className="mobile-overlay" onClick={() => setShowMobilePanel(false)}></div>}

      {/* Control Sidebar */}
      <aside className={`control-sidebar ${showMobilePanel ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div>
            <h1 className="app-title">Orot <span style={{fontSize: '16px', fontWeight: 'normal', color: '#6c757d'}}>(אורות)</span></h1>
            <p className="app-subtitle">Hebrew Text Analytics Engine</p>
          </div>
          <button className="mobile-close" onClick={() => setShowMobilePanel(false)}>✖</button>
        </div>

        <div className="sidebar-content">
          {/* Search Logic Mode (2x2 Grid with Tooltips) */}
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

          {/* View Mode Toggle */}
          <div className="input-group">
            <label>Display Value:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <label className={`segment-btn ${viewMode === 'absolute' ? 'active' : ''}`} style={{flex: 1, flexDirection: 'row'}}>
                <input type="radio" value="absolute" checked={viewMode === 'absolute'} onChange={(e) => setViewMode(e.target.value)} />
                <span>Absolute (#)</span>
              </label>
              <label className={`segment-btn ${viewMode === 'relative' ? 'active' : ''}`} style={{flex: 1, flexDirection: 'row'}}>
                <input type="radio" value="relative" checked={viewMode === 'relative'} onChange={(e) => setViewMode(e.target.value)} />
                <span>Relative (%)</span>
              </label>
            </div>
          </div>

          {/* Search Terms Inputs */}
          <div className="input-group">
            <label>Search Terms:</label>
            {searchInputs.map((input, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input
                  type="text"
                  className="search-input"
                  value={input}
                  onChange={(e) => updateSearchInput(index, e.target.value)}
                  placeholder={`Enter term ${index + 1}...`}
                  dir="rtl"
                />
                {searchInputs.length > 1 && (
                  <button className="btn btn-delete" onClick={() => removeSearchInput(index)}>✖</button>
                )}
              </div>
            ))}
            <button className="btn btn-add" onClick={addSearchInput}>+ Add Comparison Term</button>
          </div>
        </div>

        <div className="sidebar-footer">
          <button
            className="btn btn-run"
            onClick={handleRunAnalysis}
            disabled={isProcessing}
          >
            {isProcessing ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="main-canvas">
        <div className="chart-header">
          <h2>Distribution Results</h2>
        </div>

        {chartData.length > 0 ? (
          <div className="chart-container">
            {/* Responsive wrapper for mobile scaling */}
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData} margin={{ top: 30, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6c757d' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6c757d' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f8f9fa' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />

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
        ) : (
          <div style={{ textAlign: 'center', color: '#6c757d', marginTop: '40px' }}>
            <p>No data to display. Enter search terms and run analysis.</p>
          </div>
        )}

        {/* Verse Preview Panel */}
        {activePreview && activePreview.verses && activePreview.verses.length > 0 && (
          <div className="preview-container">
            <h3>Occurrences in {activePreview.name}</h3>
            {activePreview.verses.map((verse, idx) => (
              <div key={idx} className="verse-item">
                <div className="verse-ref">{verse.reference}</div>
                <div className="verse-text">{verse.text}</div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Mobile Trigger Button */}
      <button className="mobile-trigger" onClick={() => setShowMobilePanel(true)}>
        Configure Search
      </button>
    </div>
  );
}