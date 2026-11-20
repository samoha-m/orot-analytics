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
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 28px rgba(30, 58, 138, 0.08)',
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
                  ? '#fef3c7'
                  : isBlue
                  ? '#1d4ed8'
                  : '#f8fafc',
                color: isGold
                  ? '#b45309'
                  : isBlue
                  ? '#ffffff'
                  : '#94a3b8',
                border: isGold
                  ? '1px solid #f59e0b'
                  : isBlue
                  ? '1px solid #1e3a8a'
                  : '1px solid #f1f5f9',
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
          color: '#1e3a8a',
          letterSpacing: '0.2px'
        }}
      >
        {message}
      </div>
    </div>
  );
}

export default HebrewMatrixLoader;