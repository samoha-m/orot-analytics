import React from 'react';
import { booksList } from '../data/constants';
import DiscoveryFlashcardDeck from './DiscoveryFlashcardDeck';

function EmptyStateDashboard({ t, lang, onRunExample }) {
  const isRTL = lang === 'he' || lang === 'fa';

  const totalBooks = booksList.length; // 39
  const totalChapters = booksList.reduce((sum, b) => sum + (b.maxCh || 0), 0); // 929

  const stats =
    lang === 'he'
      ? [
          { label: 'ספרים', value: String(totalBooks), sub: 'תנ״ך שלם' },
          { label: 'פרקים', value: String(totalChapters), sub: 'בכל ספרי המקרא' },
          { label: 'פסוקים', value: '23,213', sub: 'אינדקס מסורה' },
          { label: 'מילים', value: '305,515', sub: 'מילים מאונדקסות' }
        ]
      : lang === 'fa'
      ? [
          { label: 'کتاب‌ها', value: String(totalBooks), sub: 'کل تنخ' },
          { label: 'فصل‌ها', value: String(totalChapters), sub: 'در تمام کتاب‌ها' },
          { label: 'آیات', value: '23,213', sub: 'متن ماسوره' },
          { label: 'واژگان', value: '305,515', sub: 'واژگان نمایه‌شده' }
        ]
      : [
          { label: 'Books', value: String(totalBooks), sub: 'Complete Tanakh' },
          { label: 'Chapters', value: String(totalChapters), sub: 'Across all books' },
          { label: 'Verses', value: '23,213', sub: 'Masoretic index' },
          { label: 'Words', value: '305,515', sub: 'Indexed words' }
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
        padding: '24px 16px',
        textAlign: 'center',
        overflowX: 'hidden'
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
          background:
            'radial-gradient(circle, rgba(56, 189, 248, 0.14) 0%, rgba(37, 99, 235, 0.08) 45%, transparent 75%)',
          filter: 'blur(36px)',
          pointerEvents: 'none'
        }}
      />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: '610px', width: '100%' }}>
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
            marginBottom: '12px'
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
            margin: '0 0 8px 0',
            fontSize: 'clamp(20px, 3vw, 29px)',
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
            margin: '0 0 22px 0',
            fontSize: '14px',
            color: '#94a3b8',
            lineHeight: '1.6'
          }}
        >
          {t('useControlPanel')}
        </p>

        {/* 4 Uniform Sky-Blue Corpus Metric Cards */}
        <div
          className="animate-fade-in-up delay-400"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(122px, 1fr))',
            gap: '10px',
            textAlign: isRTL ? 'right' : 'left',
            marginBottom: '28px'
          }}
        >
          {stats.map((st) => (
            <div
              key={st.label}
              className="hover-lift"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.84)',
                backdropFilter: 'blur(10px)',
                borderRadius: '14px',
                padding: '12px 14px',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                boxShadow:
                  '0 6px 20px rgba(0, 0, 0, 0.35), 0 0 14px -4px rgba(56, 189, 248, 0.18)'
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#94a3b8',
                  marginBottom: '2px'
                }}
              >
                {st.label}
              </div>
              <div
                style={{
                  fontSize: '19px',
                  fontWeight: '800',
                  color: '#ffffff',
                  letterSpacing: '-0.3px'
                }}
              >
                {st.value}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#38bdf8',
                  marginTop: '2px'
                }}
              >
                {st.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Airy Floating "Did You Know?" Flashcard + 15 Illuminated Dots */}
        <div className="animate-fade-in-up delay-500">
          <DiscoveryFlashcardDeck lang={lang} onRunExample={onRunExample} />
        </div>
      </div>
    </div>
  );
}

export default EmptyStateDashboard;