import React from 'react';
import logoIcon from '../assets/OROT_ICON.jpg';
import { booksList, numberToHebrew, ELS_SKIP_LOGICS } from '../data/constants';

function ControlSidebar({
  showMobilePanel,
  setShowMobilePanel,
  searchTerm,
  setSearchTerm,
  searchMode,
  setSearchMode,
  skipLogic,
  setSkipLogic,
  skipValue,
  setSkipValue,
  minSkip,
  setMinSkip,
  maxSkip,
  setMaxSkip,
  ranges,
  loading,
  updateBook,
  removeRange,
  toggleAccordion,
  handleChapterSelection,
  addRange,
  handleSearch
}) {
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
      <button className="mobile-trigger" onClick={() => setShowMobilePanel(true)}>
        🔍 Edit Search & Scopes
      </button>
      {showMobilePanel && (
        <div className="mobile-overlay" onClick={() => setShowMobilePanel(false)}></div>
      )}

      <aside className={`control-sidebar ${showMobilePanel ? 'open' : ''}`}>
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          backgroundColor: '#ffffff',
          padding: '20px',
          borderBottom: '1px solid #e9ecef',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          {/* Logo Header */}
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

          {/* Search Terms Input */}
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
              />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e9ecef', margin: '20px 0' }} />

          {/* Search Logic Mode Selector */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={sectionLabelStyle}>Search Logic Mode</label>

            <div style={{ display: 'flex', borderRadius: '6px', border: '1px solid #ced4da', overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
              {[
                { val: 'exact', lbl: 'Exact' },
                { val: 'root', lbl: 'Root' },
                { val: 'letter', lbl: 'Letter' },
                { val: 'gematria', lbl: 'Gematria' },
                { val: 'els', lbl: 'Skip (ELS)' }
              ].map((m, index) => (
                <label
                  key={m.val}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '8px 2px',
                    margin: 0,
                    cursor: 'pointer',
                    fontSize: '10.5px',
                    borderRight: index !== 4 ? '1px solid #ced4da' : 'none',
                    backgroundColor: searchMode === m.val ? '#0056b3' : 'transparent',
                    color: searchMode === m.val ? '#ffffff' : '#495057',
                    fontWeight: searchMode === m.val ? 'bold' : 'normal',
                    transition: 'background-color 0.2s, color 0.2s'
                  }}
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

          {/* ELS Configuration Board */}
          {searchMode === 'els' && (
            <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
              <label style={{ ...sectionLabelStyle, marginBottom: '6px', color: '#0056b3' }}>ELS Configuration</label>

              <div style={{ marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', color: '#6c757d', display: 'block', marginBottom: '4px' }}>Skip Logic Rule</span>
                <select
                  value={skipLogic}
                  onChange={(e) => setSkipLogic(e.target.value)}
                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '12px' }}
                >
                  {ELS_SKIP_LOGICS.map(opt => (
                    <option key={opt.val} value={opt.val}>{opt.lbl}</option>
                  ))}
                </select>
              </div>

              {skipLogic === 'fixed' && (
                <div>
                  <span style={{ fontSize: '11px', color: '#6c757d', display: 'block', marginBottom: '4px' }}>Jump Size (Letters)</span>
                  <input
                    type="number"
                    value={skipValue}
                    onChange={(e) => setSkipValue(Number(e.target.value))}
                    min="1"
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '12px' }}
                  />
                </div>
              )}

              {skipLogic === 'range' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '11px', color: '#6c757d', display: 'block', marginBottom: '4px' }}>Min Skip</span>
                    <input
                      type="number"
                      value={minSkip}
                      onChange={(e) => setMinSkip(Number(e.target.value))}
                      min="1"
                      style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '12px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '11px', color: '#6c757d', display: 'block', marginBottom: '4px' }}>Max Skip</span>
                    <input
                      type="number"
                      value={maxSkip}
                      onChange={(e) => setMaxSkip(Number(e.target.value))}
                      min="2"
                      style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '12px' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scrollable Comparison Scopes */}
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