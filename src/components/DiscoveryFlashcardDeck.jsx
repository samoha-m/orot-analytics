import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getDiscoveryFlashcards, FLASHCARD_SWAP_MS } from '../data/flashcards';

function DiscoveryFlashcardDeck({ lang = 'he', onRunExample, compact = false }) {
  const isRTL = lang === 'he' || lang === 'fa';
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const touchStartXRef = useRef(null);
  const didSwipeRef = useRef(false);

  const flashcards = useMemo(() => getDiscoveryFlashcards(lang), [lang]);

  // Swap automatically every 6 seconds on both web and mobile
  useEffect(() => {
    if (isPaused || flashcards.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % flashcards.length);
    }, FLASHCARD_SWAP_MS);
    return () => clearInterval(timer);
  }, [isPaused, flashcards.length, activeIndex]);

  const currentCard = flashcards[activeIndex] || flashcards[0];

  const tryCtaLabel =
    lang === 'he'
      ? compact
        ? 'לבדיקה'
        : 'לחץ לבדיקה'
      : lang === 'fa'
      ? compact
        ? 'جستجو'
        : 'برای جستجو کلیک کنید'
      : compact
      ? 'Try'
      : 'Click to run';

  const handleTouchStart = (e) => {
    setIsPaused(true);
    if (e.touches && e.touches.length > 0) {
      touchStartXRef.current = e.touches[0].clientX;
      didSwipeRef.current = false;
    }
  };

  const handleTouchMove = (e) => {
    if (touchStartXRef.current === null || !e.touches || e.touches.length === 0) return;
    const diff = e.touches[0].clientX - touchStartXRef.current;
    if (Math.abs(diff) > 12) {
      didSwipeRef.current = true;
    }
  };

  const handleTouchEnd = (e) => {
    setIsPaused(false);
    if (
      touchStartXRef.current !== null &&
      e.changedTouches &&
      e.changedTouches.length > 0
    ) {
      const diff = e.changedTouches[0].clientX - touchStartXRef.current;
      if (Math.abs(diff) > 36) {
        didSwipeRef.current = true;
        const goNext = isRTL ? diff > 0 : diff < 0;
        setActiveIndex((prev) =>
          goNext
            ? (prev + 1) % flashcards.length
            : (prev - 1 + flashcards.length) % flashcards.length
        );
      }
    }
    touchStartXRef.current = null;
  };

  const handleCardClick = () => {
    if (didSwipeRef.current) {
      didSwipeRef.current = false;
      return;
    }
    if (onRunExample) {
      onRunExample(currentCard);
    }
  };

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: compact ? '10px' : '14px',
        width: '100%'
      }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && onRunExample) {
            e.preventDefault();
            onRunExample(currentCard);
          }
        }}
        className="airy-flashcard"
        style={{
          width: '100%',
          padding: compact ? '14px 16px' : '20px 24px',
          borderRadius: compact ? '16px' : '20px',
          background:
            'linear-gradient(155deg, rgba(15, 23, 42, 0.48) 0%, rgba(12, 74, 110, 0.18) 100%)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(56, 189, 248, 0.26)',
          boxShadow:
            '0 10px 28px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          cursor: onRunExample ? 'pointer' : 'default',
          textAlign: isRTL ? 'right' : 'left',
          userSelect: 'none'
        }}
      >
        <div
          key={currentCard.id}
          className="flashcard-airy-swap"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: compact ? '8px' : '11px'
          }}
        >
          {/* Top Mode Pill + Action Hint */}
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
                gap: '5px',
                padding: compact ? '2px 9px' : '3px 11px',
                borderRadius: '999px',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.28)',
                color: '#7dd3fc',
                fontSize: compact ? '10.5px' : '11px',
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
                gap: '4px',
                fontSize: compact ? '11.5px' : '12px',
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
              fontSize: compact ? '13.5px' : '15px',
              fontWeight: '500',
              color: '#f1f5f9',
              lineHeight: compact ? '1.58' : '1.7'
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
          flexWrap: 'nowrap',
          gap: compact ? '2px' : '4px',
          width: '100%'
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
                padding: compact ? '6px 1.5px' : '6px 2px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <span className={`flashcard-dot ${isActive ? 'active' : ''}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default DiscoveryFlashcardDeck;