import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList } from 'recharts';
import { COLORS, booksList } from '../data/constants';
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

  // Dark Obsidian Empty-State Dashboard (Accurate 39 Books / 929 Chapters)
  if (!resultTotals) {
    const totalBooks = booksList.length; // 39
    const totalChapters = booksList.reduce((sum, b) => sum + (b.maxCh || 0), 0); // 929

    const stats =
      lang === 'he'
        ? [
            { label: 'ספרים', value: String(totalBooks), sub: 'תנ״ך שלם', accent: '#38bdf8' },
            { label: 'פרקים', value: String(totalChapters), sub: 'בכל ספרי המקרא', accent: '#38bdf8' },
            { label: 'פסוקים', value: '23,213', sub: 'אינדקס מסורה', accent: '#38bdf8' },
            { label: 'מילים', value: '305,515', sub: 'מפתוח חישובי', accent: '#34d399' }
          ]
        : lang === 'fa'
        ? [
            { label: 'کتاب‌ها', value: String(totalBooks), sub: 'کل تنخ', accent: '#38bdf8' },
            { label: 'فصل‌ها', value: String(totalChapters), sub: 'در تمام کتاب‌ها', accent: '#38bdf8' },
            { label: 'آیات', value: '23,213', sub: 'متن ماسوره', accent: '#38bdf8' },
            { label: 'واژگان', value: '305,515', sub: 'نمایه محاسباتی', accent: '#34d399' }
          ]
        : [
            { label: 'Books', value: String(totalBooks), sub: 'Complete Tanakh', accent: '#38bdf8' },
            { label: 'Chapters', value: String(totalChapters), sub: 'Across all books', accent: '#38bdf8' },
            { label: 'Verses', value: '23,213', sub: 'Masoretic index', accent: '#38bdf8' },
            { label: 'Words', value: '305,515', sub: 'Computational corpus', accent: '#34d399' }
          ];

    const engineBadge =
      lang === 'he'
        ? 'מנוע ניתוח חישובי • נוסח המסורה'
        : lang === 'fa'
        ? 'موتور تحلیل محاسباتی • متن ماسوره'
        : 'Masoretic Computational Engine';

    return (
      <div
        style={{
          position: 'relative',
          minHeight: 'calc(100% - 20px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '28px 16px',
          textAlign: 'center',
          overflow: 'hidden'
        }}
      >
        {/* Ambient Celestial Glow */}
        <div
          className="ambient-glow-primary"
          style={{
            position: 'absolute',
            width: '540px',
            height: '340px',
            borderRadius: '999px',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.14) 0%, rgba(37, 99, 235, 0.08) 45%, transparent 75%)',
            filter: 'blur(36px)',
            pointerEvents: 'none'
          }}
        />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '600px', width: '100%' }}>
          <div
            className="animate-fade-in-up delay-100"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 13px',
              borderRadius: '999px',
              backgroundColor: 'rgba(12, 74, 110, 0.45)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#7dd3fc',
              fontSize: '12px',
              fontWeight: '600',
              marginBottom: '14px'
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#38bdf8',
                boxShadow: '0 0 8px #38bdf8'
              }}
            />
            <span>{engineBadge}</span>
          </div>

          <h1
            dir="ltr"
            className="brand-title animate-fade-in-up delay-200"
            style={{
              margin: '0 0 10px 0',
              fontSize: 'clamp(21px, 3.2vw, 30px)',
              fontWeight: '800',
              background: 'linear-gradient(180deg, #ffffff 0%, #e2e8f0 55%, #7dd3fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 14px rgba(56, 189, 248, 0.28))'
            }}
          >
            OROT - Hebrew Bible Analytics Engine
          </h1>

          <p
            className="animate-fade-in-up delay-300"
            style={{
              margin: '0 0 24px 0',
              fontSize: '15px',
              color: '#94a3b8',
              lineHeight: '1.6'
            }}
          >
            {t('useControlPanel')}
          </p>

          {/* 4 Corpus Metric Cards */}
          <div
            className="animate-fade-in-up delay-400"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(122px, 1fr))',
              gap: '12px',
              textAlign: isRTL ? 'right' : 'left'
            }}
          >
            {stats.map((st, idx) => (
              <div
                key={st.label}
                className="hover-lift"
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.84)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '14px',
                  padding: '13px 14px',
                  border: idx === 0
                    ? '1px solid rgba(56, 189, 248, 0.45)'
                    : idx === 3
                    ? '1px solid rgba(52, 211, 153, 0.38)'
                    : '1px solid rgba(51, 65, 85, 0.7)',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', marginBottom: '2px' }}>
                  {st.label}
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.3px' }}>
                  {st.value}
                </div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: st.accent, marginTop: '2px' }}>
                  {st.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const displayedChartData = hideEmpty
    ? renderChartData.filter((row) => activeTerms.some((term) => (row[term] || 0) > 0))
    : renderChartData;

  const totalBars = displayedChartData.length * activeTerms.length;
  const showBarLabels = totalBars <= 20;

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
          filter: brightness(1.12);
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
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(51, 65, 85, 0.8)',
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.28)',
                  fontSize: '14px',
                  color: '#f1f5f9'
                }}
              >
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '3px',
                    backgroundColor: color,
                    boxShadow: `0 0 8px ${color}`,
                    flexShrink: 0
                  }}
                />
                <bdi style={{ fontWeight: '700', color: '#ffffff' }}>{term}</bdi>
                <span style={{ color: '#475569' }}>|</span>
                <span style={{ fontWeight: '600', color: '#cbd5e1' }}>
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
              backgroundColor: '#080d18',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid rgba(51, 65, 85, 0.85)'
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('absolute')}
              style={{
                border: viewMode === 'absolute' ? '1px solid rgba(56, 189, 248, 0.55)' : '1px solid transparent',
                padding: '6px 12px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: viewMode === 'absolute' ? '#162238' : 'transparent',
                color: viewMode === 'absolute' ? '#7dd3fc' : '#94a3b8',
                transition: 'all 0.15s'
              }}
            >
              {t('absolute')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('relative')}
              style={{
                border: viewMode === 'relative' ? '1px solid rgba(56, 189, 248, 0.55)' : '1px solid transparent',
                padding: '6px 12px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: viewMode === 'relative' ? '#162238' : 'transparent',
                color: viewMode === 'relative' ? '#7dd3fc' : '#94a3b8',
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
                borderRadius: '10px',
                border: hideEmpty ? '1px solid rgba(251, 191, 36, 0.65)' : '1px solid rgba(51, 65, 85, 0.85)',
                backgroundColor: hideEmpty ? 'rgba(251, 191, 36, 0.15)' : '#0f172a',
                color: hideEmpty ? '#fde68a' : '#94a3b8',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span>{t('hideEmpty') || 'Matches Only'}</span>
              {hideEmpty && (
                <span style={{ fontSize: '11px', fontWeight: '600', opacity: 0.9 }}>
                  ({showingBooksText})
                </span>
              )}
            </button>
          )}

          {/* Icon-Only Download Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            aria-label={t('csv') || 'Download CSV'}
            title={t('csv') || 'Download CSV'}
            style={{
              width: '34px',
              height: '34px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              border: '1px solid rgba(56, 189, 248, 0.65)',
              background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 0 14px rgba(56, 189, 248, 0.32)',
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

      {/* Elevated Dark Obsidian Chart Card */}
      {displayedChartData.length === 0 ? (
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.88)',
            borderRadius: '14px',
            border: '1px solid rgba(51, 65, 85, 0.75)',
            padding: '44px 20px',
            textAlign: 'center',
            color: '#94a3b8'
          }}
        >
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
            {t('noMatchesInScope') || 'No matches found in the selected books.'}
          </p>
        </div>
      ) : (
        <div
          className="chart-container orot-bar-chart"
          style={{
            width: '100%',
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(10px)',
            borderRadius: '14px',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)',
            overflow: 'hidden',
            boxSizing: 'border-box'
          }}
        >
          {/* Stationary Language-Aligned Chart Header */}
          <div
            dir={isRTL ? 'rtl' : 'ltr'}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '8px 16px',
              padding: '14px 18px 10px 18px',
              borderBottom: '1px solid rgba(30, 41, 59, 0.95)',
              textAlign: isRTL ? 'right' : 'left'
            }}
          >
            {/* Searched Term Legend Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px' }}>
              {activeTerms.map((term, index) => {
                const color = COLORS[index % COLORS.length];
                return (
                  <span
                    key={term}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#f1f5f9'
                    }}
                  >
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: color,
                        boxShadow: `0 0 8px ${color}`,
                        flexShrink: 0
                      }}
                    />
                    <bdi>{term}</bdi>
                  </span>
                );
              })}
            </div>

            {/* Helper Instruction */}
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis
                    dataKey="name"
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                    interval={0}
                    angle={0}
                    textAnchor="middle"
                    height={42}
                    tick={{ fontSize: 12, fontWeight: 600, fill: '#cbd5e1' }}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={viewMode !== 'absolute'}
                    tickFormatter={(val) => (viewMode === 'relative' ? `${val}%` : Number(val).toLocaleString())}
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
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
                          style={{ fill: '#f1f5f9', fontSize: '11px', fontWeight: '700' }}
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