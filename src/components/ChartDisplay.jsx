import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { calculateGematria, COLORS } from '../data/constants';

function ChartDisplay({ resultTotals, loading, activeTerms, searchMode, viewMode, setViewMode, handleExportCSV, minComfortableWidth, renderChartData, setActivePreview, t }) {
  if (loading) return <h3 style={{ color: '#0056b3' }}>{t('analyzingDataset')}</h3>;

  if (!resultTotals) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', color: '#6c757d' }}>
        <h2>{t('readyToAnalyze')}</h2>
        <p>{t('useControlPanel')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="chart-header">
        <div className="results-grid">
          {activeTerms.map((term, index) => (
            <div key={term} className="result-badge">
              <span style={{ color: COLORS[index % COLORS.length] }}>■ </span>
              <strong>{term}</strong>: {resultTotals[term]} {t('hits')}
              {searchMode !== 'gematria' && ` (${t('gem')} ${calculateGematria(term)})`}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="segmented-control" style={{ background: '#f8f9fa', border: '1px solid #dee2e6' }}>
            <label className={`segment-btn ${viewMode === 'absolute' ? 'active' : ''}`}>
              <input type="radio" checked={viewMode === 'absolute'} onChange={() => setViewMode('absolute')} /> {t('absolute')}
            </label>
            <label className={`segment-btn ${viewMode === 'relative' ? 'active' : ''}`}>
              <input type="radio" checked={viewMode === 'relative'} onChange={() => setViewMode('relative')} /> {t('relative')}
            </label>
          </div>
          <button onClick={handleExportCSV} className="btn btn-export">{t('csv')}</button>
        </div>
      </div>

      <div className="chart-container" style={{ width: '100%', overflowX: 'auto', overflowY: 'hidden' }}>
        <div style={{ minWidth: `${minComfortableWidth}px`, width: '100%', height: '350px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={renderChartData} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#6c757d" angle={-15} textAnchor="end" height={60} tick={{ fontSize: 12 }} />
              <YAxis stroke="#6c757d" allowDecimals={viewMode !== 'absolute'} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} formatter={(value) => viewMode === 'relative' ? `${value}%` : value} />
              <Legend verticalAlign="top" height={36} />
              {activeTerms.map((term, index) => (
                <Bar key={term} dataKey={term} fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} onClick={(data) => setActivePreview({ name: data.name, verses: data.verses })} cursor="pointer" maxBarSize={45} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

export default ChartDisplay;