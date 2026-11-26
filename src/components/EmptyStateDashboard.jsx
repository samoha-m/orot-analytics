import React, { useState, useEffect, useMemo } from 'react';
import { booksList } from '../data/constants';

const SWAP_INTERVAL_MS = 5800;

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

  const flashcards = useMemo(() => {
    const torahIds = ['01', '02', '03', '04', '05'];
    const findBookId = (heName, enSub) => {
      const found = booksList.find(
        (b) => b.he === heName || b.name.toLowerCase().includes(enSub)
      );
      return found ? found.id : '01';
    };

    const songId = findBookId('שיר השירים', 'song');
    const estherId = findBookId('אסתר', 'esther');
    const psalmsId = findBookId('תהילים', 'psalm');
    const proverbsId = findBookId('משלי', 'proverb');

    const modeTag = {
      gematria: lang === 'he' ? 'גימטריה' : lang === 'fa' ? 'گماتریا' : 'Gematria',
      els: lang === 'he' ? 'דילוגי אותיות' : lang === 'fa' ? 'پرش حروف' : 'Skip (ELS)',
      acronymFirst:
        lang === 'he' ? 'ראשי תיבות' : lang === 'fa' ? 'سرواژه' : 'Acronym • First',
      acronymLast:
        lang === 'he' ? 'סופי תיבות' : lang === 'fa' ? 'پایان‌واژه' : 'Acronym • Last',
      exact: lang === 'he' ? 'חיפוש טקסט' : lang === 'fa' ? 'جستجوی متن' : 'Text Search',
      letter: lang === 'he' ? 'ספירת אותיות' : lang === 'fa' ? 'شمارش حروف' : 'Letter Count'
    };

    return [
      {
        id: 'gem-13',
        tag: modeTag.gematria,
        searchMode: 'gematria',
        searchTerm: '13',
        bookIds: torahIds,
        text:
          lang === 'he'
            ? 'הידעת שלמילים "אהבה" ו-"אחד" יש בדיוק אותה גימטריה — 13?'
            : lang === 'fa'
            ? 'آیا می‌دانستید دو واژه «אהבה» (عشق) و «אחד» (یکتا) هر دو دارای ارزش گماتریایی ۱۳ هستند؟'
            : 'Did you know that אהבה (Love) and אחד (One) share the exact same Gematria value of 13?'
      },
      {
        id: 'els-torah-gen',
        tag: modeTag.els,
        searchMode: 'els',
        elsSubMode: 'auto',
        searchTerm: 'תורה',
        bookIds: ['01'],
        text:
          lang === 'he'
            ? 'הידעת שהחל מהאות ת׳ הראשונה בבראשית, דילוג של כל אות 50 יוצר את המילה "תורה"?'
            : lang === 'fa'
            ? 'آیا می‌دانستید با شروع از نخستین حرف ת در پیدایش، شمارش هر ۵۰ حرف واژه «תורה» را می‌سازد؟'
            : 'Did you know that starting from the first ת in Genesis 1:1, every 50th letter spells תורה?'
      },
      {
        id: 'acr-elul',
        tag: modeTag.acronymFirst,
        searchMode: 'acronym',
        acronymPosition: 'first',
        searchTerm: 'אלול',
        bookIds: [songId],
        text:
          lang === 'he'
            ? 'הידעת שראשי התיבות של "אני לדודי ודודי לי" בשיר השירים מרכיבים את חודש "אלול"?'
            : lang === 'fa'
            ? 'آیا می‌دانستید حروف آغازین «אני לדודי ודודי לי» در غزل غزل‌ها نام ماه «אלול» را می‌سازد؟'
            : 'Did you know the initial letters of "אני לדודי ודודי לי" in Song of Songs spell אלול?'
      },
      {
        id: 'txt-light-dark',
        tag: modeTag.exact,
        searchMode: 'exact',
        searchTerm: 'אור, חושך',
        bookIds: torahIds,
        text:
          lang === 'he'
            ? 'הידעת שאפשר להשוות בגרף אחד את תפוצת המילים "אור" מול "חושך" בחמישה חומשי תורה?'
            : lang === 'fa'
            ? 'آیا می‌دانستید می‌توانید فراوانی «אור» (نور) و «חושך» (تاریکی) را هم‌زمان در تورات مقایسه کنید؟'
            : 'Did you know you can compare "אור" (Light) vs. "חושך" (Darkness) side-by-side across the Torah?'
      },
      {
        id: 'gem-86',
        tag: modeTag.gematria,
        searchMode: 'gematria',
        searchTerm: '86',
        bookIds: torahIds,
        text:
          lang === 'he'
            ? 'הידעת שלשם "אלהים" ולמילה "הטבע" יש אותו ערך גימטרי — 86?'
            : lang === 'fa'
            ? 'آیا می‌دانستید واژه «אלהים» و «הטבע» (طبیعت) هر دو ارزش عددی ۸۶ دارند؟'
            : 'Did you know that אלהים (God) and הטבע (Nature) both equal 86 in Gematria?'
      },
      {
        id: 'acr-emet',
        tag: modeTag.acronymLast,
        searchMode: 'acronym',
        acronymPosition: 'last',
        searchTerm: 'אמת',
        bookIds: ['01'],
        text:
          lang === 'he'
            ? 'הידעת שסופי התיבות של "ברא אלהים לעשות" בסיום בריאת העולם יוצרים את המילה "אמת"?'
            : lang === 'fa'
            ? 'آیا می‌دانستید حروف پایانی «ברא אלהים לעשות» در پیدایش ۲:۳ واژه «אמת» (حقیقت) را می‌سازد؟'
            : 'Did you know the final letters of "ברא אלהים לעשות" (Genesis 2:3) spell אמת (Truth)?'
      },
      {
        id: 'els-torah-ex',
        tag: modeTag.els,
        searchMode: 'els',
        elsSubMode: 'auto',
        searchTerm: 'תורה',
        bookIds: ['02'],
        text:
          lang === 'he'
            ? 'הידעת שגם בתחילת ספר שמות מופיעה המילה "תורה" בדילוג מדויק של 50 אותיות?'
            : lang === 'fa'
            ? 'آیا می‌دانستید در آغاز کتاب خروج نیز واژه «תורה» با پرش دقیق ۵۰ حرفی پنهان شده است؟'
            : 'Did you know that תורה also appears at an exact 50-letter skip at the opening of Exodus?'
      },
      {
        id: 'gem-358',
        tag: modeTag.gematria,
        searchMode: 'gematria',
        searchTerm: '358',
        bookIds: torahIds,
        text:
          lang === 'he'
            ? 'הידעת שלמילים "משיח" ו-"נחש" יש אותה גימטריה בדיוק — 358?'
            : lang === 'fa'
            ? 'آیا می‌دانستید «משיח» (مسیح) و «נחש» (مار) هر دو دارای ارزش گماتریایی ۳۵۸ هستند؟'
            : 'Did you know that משיח (Messiah) and נחש (Serpent) both share the Gematria value of 358?'
      },
      {
        id: 'ltr-aleph-tav',
        tag: modeTag.letter,
        searchMode: 'letter',
        searchTerm: 'א, ת',
        bookIds: torahIds,
        text:
          lang === 'he'
            ? 'הידעת שאפשר למדוד את שכיחות האותיות "א" מול "ת" בכל אחד מחומשי התורה?'
            : lang === 'fa'
            ? 'آیا می‌دانستید می‌توانید بسامد حرف «א» را در برابر «ת» در تمام کتاب‌های تورات بسنجید؟'
            : 'Did you know you can measure how often א (Aleph) appears vs. ת (Tav) across the Torah?'
      },
      {
        id: 'acr-esther',
        tag: modeTag.acronymFirst,
        searchMode: 'acronym',
        acronymPosition: 'first',
        searchTerm: 'יהוה',
        bookIds: [estherId],
        text:
          lang === 'he'
            ? 'הידעת שבמגילת אסתר, ראשי התיבות של "יבוא המלך והמן היום" מצפינים את שם ההוויה?'
            : lang === 'fa'
            ? 'آیا می‌دانستید در کتاب استر، سرواژه «יבוא המלך והמן היום» نام مقدس چهارحرفی را می‌سازد؟'
            : 'Did you know the initial letters of "יבוא המלך והמן היום" in Esther encode the Divine Name?'
      },
      {
        id: 'txt-water-earth',
        tag: modeTag.exact,
        searchMode: 'exact',
        searchTerm: 'מים, ארץ',
        bookIds: torahIds,
        text:
          lang === 'he'
            ? 'הידעת כמה פעמים מופיעה המילה "מים" לעומת "ארץ" לאורך התורה?'
            : lang === 'fa'
            ? 'آیا می‌دانستید واژه «מים» (آب) چند بار در مقایسه با «ארץ» (زمین) در تورات آمده است؟'
            : 'Did you know how often "מים" (Water) appears compared to "ארץ" (Earth) across the Torah?'
      },
      {
        id: 'gem-70',
        tag: modeTag.gematria,
        searchMode: 'gematria',
        searchTerm: '70',
        bookIds: ['01', psalmsId, proverbsId],
        text:
          lang === 'he'
            ? 'הידעת שלמילים "יין" ו-"סוד" יש את אותו ערך גימטרי — 70?'
            : lang === 'fa'
            ? 'آیا می‌دانستید دو واژه «יין» (شراب) و «סוד» (راز) هر دو برابر با ۷۰ در گماتریا هستند؟'
            : 'Did you know that יין (Wine) and סוד (Secret) both equal 70 in Gematria?'
      },
      {
        id: 'acr-exodus-last',
        tag: modeTag.acronymLast,
        searchMode: 'acronym',
        acronymPosition: 'last',
        searchTerm: 'יהוה',
        bookIds: ['02'],
        text:
          lang === 'he'
            ? 'הידעת שסופי התיבות של "לי מה שמו מה" בשמות ג׳:י״ג יוצרים את שם ההוויה?'
            : lang === 'fa'
            ? 'آیا می‌دانستید حروف پایانی «לי מה שמו מה» در خروج ۳:۱۳ نام چهارحرفی را پدید می‌آورد؟'
            : 'Did you know the final letters of "לי מה שמו מה" (Exodus 3:13) spell out the Divine Name?'
      },
      {
        id: 'els-moshe',
        tag: modeTag.els,
        searchMode: 'els',
        elsSubMode: 'auto',
        searchTerm: 'משה',
        bookIds: ['01'],
        text:
          lang === 'he'
            ? 'הידעת שאפשר לאתר דילוגי אותיות של השם "משה" השזורים בתוך ספר בראשית?'
            : lang === 'fa'
            ? 'آیا می‌دانستید می‌توانید پرش‌های حروف نام «משה» (موسی) را در کتاب پیدایش کشف کنید؟'
            : 'Did you know you can uncover skip sequences of the name משה (Moses) woven inside Genesis?'
      },
      {
        id: 'txt-shalom',
        tag: modeTag.exact,
        searchMode: 'exact',
        searchTerm: 'שלום',
        bookIds: torahIds,
        text:
          lang === 'he'
            ? 'הידעת היכן בתורה מרוכזת המילה "שלום" ובאילו פסוקים היא מופיעה?'
            : lang === 'fa'
            ? 'آیا می‌دانستید واژه «שלום» (صلح) در کدام بخش‌های تورات بیشترین تمرکز را دارد؟'
            : 'Did you know where the word שלום (Peace) is concentrated across the Five Books of Moses?'
      }
    ];
  }, [lang]);

  useEffect(() => {
    if (isPaused || flashcards.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % flashcards.length);
    }, SWAP_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isPaused, flashcards.length]);

  const currentCard = flashcards[activeIndex] || flashcards[0];

  const tryCtaLabel =
    lang === 'he'
      ? 'לחץ לבדיקה'
      : lang === 'fa'
      ? 'برای جستجو کلیک کنید'
      : 'Click to run';

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
        <div
          className="animate-fade-in-up delay-500"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px'
          }}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={() => onRunExample && onRunExample(currentCard)}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && onRunExample) {
                e.preventDefault();
                onRunExample(currentCard);
              }
            }}
            className="airy-flashcard"
            style={{
              width: '100%',
              padding: '20px 24px',
              borderRadius: '20px',
              background:
                'linear-gradient(155deg, rgba(15, 23, 42, 0.44) 0%, rgba(12, 74, 110, 0.16) 100%)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(56, 189, 248, 0.24)',
              boxShadow:
                '0 10px 30px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
              cursor: onRunExample ? 'pointer' : 'default',
              textAlign: isRTL ? 'right' : 'left'
            }}
          >
            <div
              key={currentCard.id}
              className="flashcard-airy-swap"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '11px'
              }}
            >
              {/* Top Pill + Action Hint */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '3px 11px',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.28)',
                    color: '#7dd3fc',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}
                >
                  <span style={{ color: '#fbbf24' }}>✦</span>
                  <span>{currentCard.tag}</span>
                </span>

                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#38bdf8'
                  }}
                >
                  <span>{tryCtaLabel}</span>
                  <svg
                    width="13"
                    height="13"
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
                </span>
              </div>

              {/* Airy Question Copy */}
              <p
                style={{
                  margin: 0,
                  fontSize: '15px',
                  fontWeight: '500',
                  color: '#f1f5f9',
                  lineHeight: '1.7'
                }}
              >
                {currentCard.text}
              </p>
            </div>
          </div>

          {/* 15 Interactive Dots with Luminous Active Enhancement */}
          <div
            role="tablist"
            aria-label="Flashcard examples"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '4px'
            }}
          >
            {flashcards.map((card, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={card.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`${idx + 1}: ${card.tag}`}
                  onClick={() => setActiveIndex(idx)}
                  className="flashcard-dot-btn"
                  style={{
                    padding: '6px 2px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span
                    className={`flashcard-dot ${isActive ? 'active' : ''}`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmptyStateDashboard;