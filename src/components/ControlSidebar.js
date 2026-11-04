import React from 'react';
import logoIcon from '../assets/OROT_ICON.jpg';
import { booksList, numberToHebrew } from '../data/constants';

function ControlSidebar({
  showMobilePanel,
  setShowMobilePanel,
  searchTerm,
  setSearchTerm,
  searchMode,
  setSearchMode,
  ranges,
  loading,
  updateBook,
  removeRange,
  toggleAccordion,
  handleChapterSelection,
  addRange,
  handleSearch
}) {

  // Micro-Typography styling object for section labels
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
    <>
      {/* MOBILE TOGGLE & OVERLAY */}
      <button className="mobile-trigger" onClick={() => setShowMobilePanel(true)}>
        🔍 Edit Search & Scopes
      </button>
      {showMobilePanel && (
        <div className="mobile-overlay" onClick={() => setShowMobilePanel(false)}></div>
      )}

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
    </>
  );
}

export default ControlSidebar;