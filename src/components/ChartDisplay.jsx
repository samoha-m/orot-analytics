import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList } from 'recharts';
import { COLORS } from '../data/constants';
import HebrewMatrixLoader from './HebrewMatrixLoader';

function ChartDisplay({
  resultTotals,
  loading,
  activeTerms,
  viewMode,
  setViewMode,
  handleExportCSV,
  minComfortableWidth,
  renderChartData,
  setActivePreview,
  t,
  lang
}) {
  const [hideEmpty, setHideEmpty] = useState(true);
  const scrollContainerRef = useRef(null);
  const isRTL = lang === 'he' || lang === 'fa';

  // Default "Matches Only" to checked whenever multi-book results arrive
  useEffect(() => {
    if (renderChartData && renderChartData.length > 1) {
      setHideEmpty(true);
    } else {
      setHideEmpty(false);
    }
  }, [resultTotals]);

  // Always start horizontal scroll at the leftmost position (the first book)
  useEffect(() => {
    const resetScrollToStart = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = 0;
      }
    };
    resetScrollToStart();
    const frameId = requestAnimationFrame(resetScrollToStart);
    return () => cancelAnimationFrame(frameId);
  }, [resultTotals, hideEmpty, lang]);

  if (loading) {
    return <HebrewMatrixLoader message={t('analyzingDataset')} />;
  }

  if (!resultTotals) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', color: '#94a3b8', padding: '0 16px' }}>
        <div
          dir="ltr"
          style={{
            fontSize: '20px',
            fontWeight: '700',
            letterSpacing: '0.3px',
            color: '#94a3b8',
            marginBottom: '8px'
          }}
        >
          OROT - Hebrew Bible Analytics Engine
        </div>
        <p style={{ fontSize: '14px', margin: 0, color: '#94a3b8' }}>
          {t('useControlPanel')}
        </p>
      </div>
    );
  }

  const displayedChartData = hideEmpty
    ? renderChartData.filter((row) => activeTerms.some((term) => (row[term] || 0) > 0))
    : renderChartData;

  const totalBars = displayedChartData.length * activeTerms.length;
  const showBarLabels = totalBars <= 20;

  // Ensure each book/scope column gets at least 135px so multi-word labels never collide
  const perCategoryWidth = Math.max(135, activeTerms.length * 52);
  const effectiveMinWidth = Math.max(
    displayedChartData.length === renderChartData.length ? (minComfortableWidth || 0) : 0,
    80 + displayedChartData.length * perCategoryWidth
  );

  const formatValue = (val) => {
    if (val === null || val === undefined) return '';
    return viewMode === 'relative' ? `${val}%` : Number(val).toLocaleString();
  };

  const showingBooksText = typeof t('showingBooks') === 'function'
    ? t('showingBooks')(displayedChartData.length, renderChartData.length)
    : `${displayedChartData.length} of ${renderChartData.length}`;

  return (
    <>
      <style>{`
        .orot-bar-chart .recharts-bar-rectangle {
          transition: filter 0.15s ease;
        }
        .orot-bar-chart .recharts-bar-rectangle:hover {
          filter: brightness(0.92);
        }
      `}</style>

      {/* Top Summary & Controls Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px'
        }}
      >
        {/* Term Result Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          {activeTerms.map((term, index) => {
            const color = COLORS[index % COLORS.length];
            const count = resultTotals[term] || 0;
            return (
              <div
                key={term}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                  fontSize: '14px',
                  color: '#1e293b'
                }}
              >
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '3px',
                    backgroundColor: color,
                    flexShrink: 0
                  }}
                />
                <bdi style={{ fontWeight: '700', color: '#0f172a' }}>{term}</bdi>
                <span style={{ color: '#cbd5e1' }}>|</span>
                <span style={{ fontWeight: '600', color: '#334155' }}>
                  {count.toLocaleString()} {t('hits')}
                </span>
              </div>
            );
          })}
        </div>

        {/* Mode Toggle, Matches-Only Pill, & Icon-Only Download Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: '#f1f5f9',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('absolute')}
              style={{
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: viewMode === 'absolute' ? '#ffffff' : 'transparent',
                color: viewMode === 'absolute' ? '#1d4ed8' : '#64748b',
                boxShadow: viewMode === 'absolute' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              {t('absolute')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('relative')}
              style={{
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: viewMode === 'relative' ? '#ffffff' : 'transparent',
                color: viewMode === 'relative' ? '#1d4ed8' : '#64748b',
                boxShadow: viewMode === 'relative' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              {t('relative')}
            </button>
          </div>

          {/* Single Matches-Only Filter Pill */}
          {renderChartData.length > 1 && (
            <button
              type="button"
              onClick={() => setHideEmpty((prev) => !prev)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '8px',
                border: hideEmpty ? '1px solid #f59e0b' : '1px solid #cbd5e1',
                backgroundColor: hideEmpty ? '#fef3c7' : '#ffffff',
                color: hideEmpty ? '#92400e' : '#475569',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                transition: 'all 0.15s'
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span>{t('hideEmpty') || "Matches Only"}</span>
              {hideEmpty && (
                <span style={{ fontSize: '11px', fontWeight: '600', opacity: 0.85 }}>
                  ({showingBooksText})
                </span>
              )}
            </button>
          )}

          {/* Icon-Only Download Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            aria-label={t('csv') || "Download CSV"}
            title={t('csv') || "Download CSV"}
            style={{
              width: '34px',
              height: '34px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              border: '1px solid #1e3a8a',
              backgroundColor: '#1d4ed8',
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(29, 78, 216, 0.25)',
              transition: 'background-color 0.15s',
              flexShrink: 0
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Elevated Chart Card */}
      {displayedChartData.length === 0 ? (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '44px 20px',
            textAlign: 'center',
            color: '#64748b'
          }}
        >
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
            {t('noMatchesInScope') || "No matches found in the selected books."}
          </p>
        </div>
      ) : (
        <div
          className="chart-container orot-bar-chart"
          style={{
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
            overflow: 'hidden',
            boxSizing: 'border-box'
          }}
        >
          {/* Stationary Language-Aligned Chart Header (Does NOT Scroll with Bars) */}
          <div
            dir={isRTL ? 'rtl' : 'ltr'}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '8px 16px',
              padding: '14px 18px 10px 18px',
              borderBottom: '1px solid #f1f5f9',
              textAlign: isRTL ? 'right' : 'left'
            }}
          >
            {/* Searched Term Legend Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px' }}>
              {activeTerms.map((term, index) => (
                <span
                  key={term}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#1e293b'
                  }}
                >
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: COLORS[index % COLORS.length],
                      flexShrink: 0
                    }}
                  />
                  <bdi>{term}</bdi>
                </span>
              ))}
            </div>

            {/* Helper Instruction */}
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              {t('clickBarHint')}
            </span>
          </div>

          {/* Horizontally Scrollable Bar Area (Starts at First Book on Left, Scrolls Right) */}
          <div
            ref={scrollContainerRef}
            dir="ltr"
            style={{
              width: '100%',
              overflowX: 'auto',
              overflowY: 'hidden',
              padding: '10px 16px 8px 16px',
              boxSizing: 'border-box',
              direction: 'ltr'
            }}
          >
            <div dir="ltr" style={{ minWidth: `${effectiveMinWidth}px`, width: '100%', height: '335px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={displayedChartData}
                  margin={{ top: 22, right: 24, left: 8, bottom: 16 }}
                  barCategoryGap="24%"
                  barGap={6}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                    interval={0}
                    angle={0}
                    textAnchor="middle"
                    height={42}
                    tick={{ fontSize: 12, fontWeight: 500, fill: '#334155' }}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={viewMode !== 'absolute'}
                    tickFormatter={(val) => (viewMode === 'relative' ? `${val}%` : Number(val).toLocaleString())}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    width={viewMode === 'relative' ? 58 : 48}
                    domain={[
                      0,
                      (dataMax) => {
                        if (!dataMax || dataMax <= 0) return viewMode === 'relative' ? 1 : 5;
                        return viewMode === 'relative'
                          ? Number((dataMax * 1.18).toFixed(3))
                          : Math.ceil(dataMax * 1.15);
                      }
                    ]}
                  />
                  {activeTerms.map((term, index) => (
                    <Bar
                      key={term}
                      dataKey={term}
                      fill={COLORS[index % COLORS.length]}
                      radius={[6, 6, 0, 0]}
                      onClick={(data) => setActivePreview({ name: data.name, verses: data.verses })}
                      cursor="pointer"
                      maxBarSize={52}
                    >
                      {showBarLabels && (
                        <LabelList
                          dataKey={term}
                          position="top"
                          formatter={(val) => (val && val > 0 ? formatValue(val) : '')}
                          style={{ fill: '#334155', fontSize: '11px', fontWeight: '600' }}
                        />
                      )}
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ChartDisplay;