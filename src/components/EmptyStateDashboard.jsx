import React, { useState, useEffect, useMemo } from 'react';
import { booksList } from '../data/constants';

const SLIDE_DURATION_MS = 6500;

function EmptyStateDashboard({ t, lang, onRunExample }) {
  const isRTL = lang === 'he' || lang === 'fa';
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

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

  // Resolve book IDs dynamically from booksList so scopes always match
  const examples = useMemo(() => {
    const torahIds = ['01', '02', '03', '04', '05'];
    const songBook =
      booksList.find(
        (b) =>
          b.he === 'שיר השירים' ||
          b.name.toLowerCase().includes('song')
      ) || booksList[0];

    return [
      {
        id: 'els-torah',
        searchMode: 'els',
        elsSubMode: 'auto',
        searchTerm: 'תורה',
        bookIds: ['01'],
        pillLabel: lang === 'he' ? 'דילוגי אותיות' : lang === 'fa' ? 'پرش حروف' : 'Skip (ELS)',
        title:
          lang === 'he'
            ? 'המילה "תורה" בדילוג של 50 אותיות בבראשית'
            : lang === 'fa'
            ? 'واژه «תורה» با پرش ۵۰ حرفی در پیدایش'
            : '"Torah" encoded at a 50-letter skip in Genesis',
        description:
          lang === 'he'
            ? 'החל מהאות ת׳ הראשונה במילה "בראשית", ספירה של כל אות 50 יוצרת את המילה ת-ו-ר-ה.'
            : lang === 'fa'
            ? 'با شروع از نخستین حرف ת در «בראשית»، شمارش هر ۵۰ حرف واژه ת-ו-ר-ה را می‌سازد.'
            : 'Starting from the first ת in "Bereshit" (Genesis 1:1), counting every 50th letter spells ת-ו-ר-ה.',
        previewRef:
          lang === 'he'
            ? 'בראשית א׳:א׳ • דילוג +50'
            : lang === 'fa'
            ? 'پیدایش ۱:۱ • پرش +۵۰'
            : 'Genesis 1:1 • Skip +50',
        previewSegments: [
          { text: 'בְּרֵאשִׁי' },
          { text: 'ת', highlight: true },
          { text: ' בָּרָא אֱלֹהִים ... ' },
          { text: 'ו', highlight: true },
          { text: ' ... ' },
          { text: 'ר', highlight: true },
          { text: ' ... ' },
          { text: 'ה', highlight: true }
        ]
      },
      {
        id: 'gematria-86',
        searchMode: 'gematria',
        searchTerm: '86',
        bookIds: torahIds,
        pillLabel: lang === 'he' ? 'גימטריה' : lang === 'fa' ? 'گماتریا' : 'Gematria',
        title:
          lang === 'he'
            ? 'הערך 86: "אלהים" = "הטבע" בחמישה חומשי תורה'
            : lang === 'fa'
            ? 'ارزش عددی ۸۶: «אלהים» = «הטבע» در تورات'
            : 'Value 86: "Elohim" (אלהים) across the Torah',
        description:
          lang === 'he'
            ? 'איתור כל המילים השלמות שערכן הגימטרי שווה ל-86 והשוואת תפוצתן בין חומשי התורה.'
            : lang === 'fa'
            ? 'یافتن تمام واژگان کامل با ارزش گماتریایی ۸۶ و مقایسه فراوانی آن‌ها در پنج کتاب تورات.'
            : 'Finds every complete word with a numerical value of 86 and compares its distribution across the Torah.',
        previewRef:
          lang === 'he'
            ? 'בראשית א׳:א׳ • ערך 86'
            : lang === 'fa'
            ? 'پیدایش ۱:۱ • ارزش ۸۶'
            : 'Genesis 1:1 • Value 86',
        previewSegments: [
          { text: 'בְּרֵאשִׁית בָּרָא ' },
          { text: 'אֱלֹהִים', highlight: true },
          { text: ' אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ' }
        ]
      },
      {
        id: 'acronym-elul',
        searchMode: 'acronym',
        acronymPosition: 'first',
        searchTerm: 'אלול',
        bookIds: [songBook.id],
        pillLabel: lang === 'he' ? 'ראשי תיבות' : lang === 'fa' ? 'سرواژه‌ها' : 'Acronyms',
        title:
          lang === 'he'
            ? 'ראשי תיבות "אלול" בשיר השירים'
            : lang === 'fa'
            ? 'سرواژه «אלול» در غزل غزل‌های سلیمان'
            : 'Acronym "Elul" (אלול) hidden in Song of Songs',
        description:
          lang === 'he'
            ? 'האותיות הראשונות של ארבע המילים "אני לדודי ודודי לי" מרכיבות יחד את חודש אלול.'
            : lang === 'fa'
            ? 'حروف آغازین چهار واژه «אני לדודי ודודי לי» نام ماه عبری אלול را می‌سازند.'
            : 'The initial letters of the four consecutive words "Ani LeDodi VeDodi Li" spell אלול.',
        previewRef:
          lang === 'he'
            ? 'שיר השירים ו׳:ג׳ • ראשי תיבות'
            : lang === 'fa'
            ? 'غزل غزل‌ها ۶:۳ • سرواژه'
            : 'Song of Songs 6:3 • First Letters',
        previewSegments: [
          { text: 'א', highlight: true },
          { text: 'נִי ' },
          { text: 'ל', highlight: true },
          { text: 'דוֹדִי ' },
          { text: 'ו', highlight: true },
          { text: 'דוֹדִי ' },
          { text: 'ל', highlight: true },
          { text: 'י' }
        ]
      },
      {
        id: 'text-compare',
        searchMode: 'exact',
        searchTerm: 'מים, ארץ',
        bookIds: torahIds,
        pillLabel: lang === 'he' ? 'חיפוש טקסט' : lang === 'fa' ? 'جستجوی متن' : 'Text Search',
        title:
          lang === 'he'
            ? 'השוואת מופעים: "מים" מול "ארץ" בתורה'
            : lang === 'fa'
            ? 'مقایسه فراوانی: «מים» در برابر «ארץ» در تورات'
            : 'Term Comparison: "Water" (מים) vs. "Earth" (ארץ)',
        description:
          lang === 'he'
            ? 'הפרדה בפסיק מאפשרת להשוות מספר מילים במקביל בגרף עמודות ולצפות בפסוקים.'
            : lang === 'fa'
            ? 'جدا کردن واژه‌ها با کاما امکان مقایسه هم‌زمان چند واژه را در نمودار فراهم می‌کند.'
            : 'Separate terms with commas to compare multiple words side-by-side in an interactive chart.',
        previewRef:
          lang === 'he'
            ? 'בראשית א׳:י׳ • השוואה מרובה'
            : lang === 'fa'
            ? 'پیدایش ۱:۱۰ • مقایسه چندگانه'
            : 'Genesis 1:10 • Multi-Term',
        previewSegments: [
          { text: 'וַיִּקְרָא אֱלֹהִים לַיַּבָּשָׁה ' },
          { text: 'אֶרֶץ', highlight: true },
          { text: ' וּלְמִקְוֵה הַ' },
          { text: 'מַּיִם', highlight: true },
          { text: ' קָרָא יַמִּים' }
        ]
      }
    ];
  }, [lang]);

  useEffect(() => {
    if (isPaused || examples.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % examples.length);
    }, SLIDE_DURATION_MS);
    return () => clearInterval(timer);
  }, [isPaused, examples.length]);

  const currentExample = examples[activeIndex] || examples[0];

  const sectionHeader =
    lang === 'he'
      ? 'דוגמאות חיות מתוך התנ״ך'
      : lang === 'fa'
      ? 'نمونه‌های زنده از تنخ'
      : 'Curated Bible Discoveries';

  const tryButtonLabel =
    lang === 'he'
      ? 'הרץ דוגמה זו'
      : lang === 'fa'
      ? 'اجرای این نمونه'
      : 'Try this example';

  return (
    <div
      style={{
        position: 'relative',
        minHeight: 'calc(100% - 20px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '22px 14px 32px 14px',
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

      <div style={{ position: 'relative', zIndex: 2, maxWidth: '640px', width: '100%' }}>
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
            margin: '0 0 20px 0',
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
            marginBottom: '20px'
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

        {/* Curated Spotlight Carousel */}
        <div
          className="animate-fade-in-up delay-500"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          style={{
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: 'rgba(13, 20, 36, 0.92)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            padding: '16px 18px 18px 18px',
            border: '1px solid rgba(56, 189, 248, 0.42)',
            boxShadow:
              '0 12px 32px rgba(0, 0, 0, 0.48), 0 0 22px -6px rgba(56, 189, 248, 0.24)',
            textAlign: isRTL ? 'right' : 'left'
          }}
        >
          {/* Top Bar: Section Title & Interactive Mode Pills */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              marginBottom: '14px',
              paddingBottom: '10px',
              borderBottom: '1px solid rgba(51, 65, 85, 0.65)'
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: '700',
                color: '#7dd3fc'
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>{sectionHeader}</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {examples.map((ex, idx) => {
                const isSelected = idx === activeIndex;
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      border: isSelected
                        ? '1px solid rgba(56, 189, 248, 0.85)'
                        : '1px solid rgba(51, 65, 85, 0.85)',
                      backgroundColor: isSelected
                        ? 'rgba(56, 189, 248, 0.2)'
                        : 'rgba(9, 14, 26, 0.85)',
                      color: isSelected ? '#e0f2fe' : '#94a3b8',
                      transition: 'all 0.16s ease'
                    }}
                  >
                    {ex.pillLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Smooth Crossfading Slide Body */}
          <div key={currentExample.id} className="spotlight-slide-enter">
            <h3
              style={{
                margin: '0 0 6px 0',
                fontSize: '16px',
                fontWeight: '800',
                color: '#f8fafc',
                lineHeight: '1.4'
              }}
            >
              {currentExample.title}
            </h3>

            <p
              style={{
                margin: '0 0 12px 0',
                fontSize: '13px',
                color: '#cbd5e1',
                lineHeight: '1.55'
              }}
            >
              {currentExample.description}
            </p>

            {/* Sample Hebrew Snippet Box */}
            <div
              style={{
                backgroundColor: 'rgba(8, 12, 22, 0.9)',
                border: '1px solid rgba(51, 65, 85, 0.75)',
                borderRight: '3px solid #fbbf24',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '14px'
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#7dd3fc',
                  marginBottom: '4px'
                }}
              >
                {currentExample.previewRef}
              </div>
              <div
                dir="rtl"
                style={{
                  fontSize: '18px',
                  lineHeight: '1.7',
                  fontFamily: '"Times New Roman", serif',
                  color: '#f1f5f9',
                  textAlign: 'right'
                }}
              >
                {currentExample.previewSegments.map((seg, sIdx) =>
                  seg.highlight ? (
                    <span
                      key={sIdx}
                      className="highlight-match"
                      style={{ padding: '0 4px', margin: '0 1px' }}
                    >
                      {seg.text}
                    </span>
                  ) : (
                    <React.Fragment key={sIdx}>{seg.text}</React.Fragment>
                  )
                )}
              </div>
            </div>

            {/* Footer Row: Query Chip + One-Click "Try This Example" Action */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px'
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: '#94a3b8'
                }}
              >
                <span>{lang === 'he' ? 'מילת חיפוש:' : lang === 'fa' ? 'عبارت:' : 'Query:'}</span>
                <code
                  dir="rtl"
                  style={{
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    color: '#fde68a',
                    fontWeight: '800',
                    fontFamily: 'inherit'
                  }}
                >
                  {currentExample.searchTerm}
                </code>
              </div>

              {onRunExample && (
                <button
                  type="button"
                  onClick={() => onRunExample(currentExample)}
                  className="btn hover-lift"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '8px 15px',
                    fontSize: '13px',
                    borderRadius: '9px',
                    background: 'linear-gradient(90deg, #2563eb 0%, #0284c7 100%)',
                    border: '1px solid rgba(56, 189, 248, 0.65)',
                    color: '#ffffff',
                    boxShadow: '0 0 16px rgba(56, 189, 248, 0.32)'
                  }}
                >
                  <span>{tryButtonLabel}</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }}
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Bottom Auto-Advance Progress Track */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: '3px',
              backgroundColor: 'rgba(30, 41, 59, 0.8)'
            }}
          >
            <div
              key={`${currentExample.id}-progress`}
              className="spotlight-progress-bar"
              style={{
                height: '100%',
                width: '100%',
                background: 'linear-gradient(90deg, #38bdf8, #fbbf24)',
                transformOrigin: isRTL ? 'right center' : 'left center',
                animationDuration: `${SLIDE_DURATION_MS}ms`,
                animationPlayState: isPaused ? 'paused' : 'running'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmptyStateDashboard;