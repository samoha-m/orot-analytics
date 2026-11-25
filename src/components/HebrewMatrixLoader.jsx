import React, { useState, useEffect } from 'react';

const HEBREW_ALPHABET = [
  'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'כ',
  'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר', 'ש', 'ת'
];

const ROWS = 4;
const COLS = 8;
const TOTAL_CELLS = ROWS * COLS;

function HebrewMatrixLoader({ message }) {
  const [cells, setCells] = useState(() =>
    Array.from({ length: TOTAL_CELLS }, (_, idx) => ({
      char: HEBREW_ALPHABET[(idx * 5 + 3) % HEBREW_ALPHABET.length],
      tone: idx % 7 === 0 ? 'gold' : idx % 5 === 0 ? 'blue' : 'base'
    }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCells((prev) =>
        prev.map((cell, idx) => {
          const shouldMutate = Math.random() < 0.28;
          const nextChar = shouldMutate
            ? HEBREW_ALPHABET[Math.floor(Math.random() * HEBREW_ALPHABET.length)]
            : cell.char;

          const roll = Math.random();
          let nextTone = 'base';
          if (roll < 0.14) nextTone = 'gold';
          else if (roll < 0.34) nextTone = 'blue';
          else if (idx % 9 === 0 && !shouldMutate) nextTone = cell.tone;

          return { char: nextChar, tone: nextTone };
        })
      );
    }, 240);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '56px 16px',
        textAlign: 'center'
      }}
    >
      <div
        dir="rtl"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, 34px)`,
          gap: '6px',
          padding: '14px',
          borderRadius: '16px',
          backgroundColor: '#0d1424',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 14px 36px rgba(0, 0, 0, 0.55)',
          marginBottom: '18px'
        }}
      >
        {cells.map((cell, idx) => {
          const isGold = cell.tone === 'gold';
          const isBlue = cell.tone === 'blue';
          return (
            <div
              key={idx}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: isGold || isBlue ? '800' : '500',
                fontFamily: '"Times New Roman", serif',
                backgroundColor: isGold
                  ? 'rgba(251, 191, 36, 0.18)'
                  : isBlue
                  ? '#0284c7'
                  : '#090e1a',
                color: isGold
                  ? '#fde68a'
                  : isBlue
                  ? '#ffffff'
                  : '#64748b',
                border: isGold
                  ? '1px solid rgba(251, 191, 36, 0.65)'
                  : isBlue
                  ? '1px solid #38bdf8'
                  : '1px solid rgba(30, 41, 59, 0.85)',
                boxShadow: isBlue
                  ? '0 0 12px rgba(56, 189, 248, 0.45)'
                  : isGold
                  ? '0 0 10px rgba(251, 191, 36, 0.25)'
                  : 'none',
                transform: isGold || isBlue ? 'scale(1.06)' : 'scale(1)',
                transition: 'all 0.22s ease'
              }}
            >
              {cell.char}
            </div>
          );
        })}
      </div>

      <div
        style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#7dd3fc',
          letterSpacing: '0.2px'
        }}
      >
        {message}
      </div>
    </div>
  );
}

export default HebrewMatrixLoader;