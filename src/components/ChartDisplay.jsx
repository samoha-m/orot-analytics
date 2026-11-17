import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { COLORS } from '../data/constants';

function ChartDisplay({ resultTotals, loading, activeTerms, viewMode, setViewMode, handleExportCSV, minComfortableWidth, renderChartData, setActivePreview, t }) {
  if (loading) return <h3 style={{ color: '#0056b3' }}>{t('analyzingDataset')}</h3>;

  if (!resultTotals) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', color: '#adb5bd', padding: '0 16px' }}>
        <div
          dir="ltr"
          style={{
            fontSize: '20px',
            fontWeight: '600',
            letterSpacing: '0.3px',
            color: '#adb5bd',
            marginBottom: '8px'
          }}
        >
          OROT - Hebrew Bible Analytics Engine
        </div>
        <p style={{ fontSize: '14px', margin: 0, color: '#adb5bd' }}>
          {t('useControlPanel')}
        </p>
      </div>
    );
  }

  const totalBars = renderChartData.length * activeTerms.length;
  const showBarLabels = totalBars <= 20;

  // Ensure each book/scope column gets at least 135px so multi-word labels never collide
  const perCategoryWidth = Math.max(135, activeTerms.length * 52);
  const effectiveMinWidth = Math.max(minComfortableWidth || 0, 80 + renderChartData.length * perCategoryWidth);

  const formatValue = (val) => {
    if (val === null || val === undefined) return '';
    return viewMode === 'relative' ? `${val}%` : Number(val).toLocaleString();
  };

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

        {/* Mode Toggle & Compact Export Action */}
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
                color: viewMode === 'absolute' ? '#0056b3' : '#64748b',
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
                color: viewMode === 'relative' ? '#0056b3' : '#64748b',
                boxShadow: viewMode === 'relative' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              {t('relative')}
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              border: '1px solid #15803d',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(22, 163, 74, 0.2)',
              transition: 'background-color 0.15s'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>{t('csv') || "Export"}</span>
          </button>
        </div>
      </div>

      {/* Elevated Chart Card */}
      <div
        className="chart-container orot-bar-chart"
        style={{
          width: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
          padding: '14px 16px 8px 16px',
          boxSizing: 'border-box'
        }}
      >
        {/* Subtle Helper Caption */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            {t('clickBarHint')}
          </span>
        </div>

        <div dir="ltr" style={{ minWidth: `${effectiveMinWidth}px`, width: '100%', height: '355px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={renderChartData}
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
              <Legend
                verticalAlign="top"
                height={38}
                iconType="circle"
                iconSize={10}
                formatter={(value) => (
                  <span
                    style={{
                      color: '#1e293b',
                      fontWeight: '600',
                      fontSize: '13px',
                      marginLeft: '6px',
                      marginRight: '14px'
                    }}
                  >
                    {value}
                  </span>
                )}
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
    </>
  );
}

export default ChartDisplay;