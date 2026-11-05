import { isPrime } from './data/constants.js';

self.onmessage = async (e) => {
  const { ranges, terms, searchMode, booksList, skipLogic, skipValue, minSkip, maxSkip } = e.data;

  try {
    if (searchMode === 'els') {
      const targetTerm = terms[0] || 'אור';
      const termLetters = targetTerm.replace(/\s+/g, '').split('');
      const termLen = termLetters.length;

      let matches = [];

      for (const range of ranges) {
        const bookObj = booksList.find(b => b.id === range.bookId);
        if (!bookObj) continue;

        const response = await fetch(`/data/${bookObj.id}_${bookObj.name}.json`);
        const bookData = await response.json();

        let letterSequence = [];
        Object.keys(bookData).forEach(chNum => {
          const chInt = parseInt(chNum, 10);
          if (range.selectedChapters.includes(chInt)) {
            Object.keys(bookData[chNum]).forEach(vNum => {
              const verseText = bookData[chNum][vNum];
              for (let i = 0; i < verseText.length; i++) {
                const char = verseText[i];
                if (/[\u0590-\u05FF]/.test(char)) {
                  letterSequence.push({
                    char,
                    ref: `${bookObj.he} ${chNum}:${vNum}`,
                    letterIdx: letterSequence.length
                  });
                }
              }
            });
          }
        });

        let validSkips = [];
        if (skipLogic === 'fixed') {
          validSkips = [Math.max(1, skipValue || 10)];
        } else if (skipLogic === 'range') {
          const min = Math.max(1, minSkip || 2);
          const max = Math.max(min, maxSkip || 50);
          for (let s = min; s <= max; s++) validSkips.push(s);
        } else if (skipLogic === 'prime') {
          for (let s = 2; s <= 50; s++) {
            if (isPrime(s)) validSkips.push(s);
          }
        } else if (skipLogic === 'fibonacci') {
          validSkips = [2, 3, 5, 8, 13, 21, 34, 55];
        }

        for (const skip of validSkips) {
          for (let start = 0; start < letterSequence.length - (termLen - 1) * skip; start++) {
            let matched = true;
            let matchIndices = [];

            for (let k = 0; k < termLen; k++) {
              const idx = start + k * skip;
              if (letterSequence[idx].char !== termLetters[k]) {
                matched = false;
                break;
              }
              matchIndices.push(idx);
            }

            if (matched) {
              const padding = 15;
              const gridStart = Math.max(0, start - padding);
              const gridEnd = Math.min(letterSequence.length, start + (termLen - 1) * skip + padding + 1);
              const gridLetters = letterSequence.slice(gridStart, gridEnd).map((item, idx) => ({
                ...item,
                isMatch: matchIndices.includes(gridStart + idx)
              }));

              matches.push({
                term: targetTerm,
                skip,
                bookName: bookObj.name,
                width: skip,
                gridLetters
              });

              if (matches.length >= 5) break;
            }
          }
          if (matches.length >= 5) break;
        }
      }

      self.postMessage({ status: 'success', isEls: true, elsData: { matches } });
      return;
    }

    // Standard word/root/letter search logic
    let chartData = [];
    let totals = {};
    terms.forEach(t => { totals[t] = 0; });

    for (const range of ranges) {
      const bookObj = booksList.find(b => b.id === range.bookId);
      if (!bookObj) continue;

      const response = await fetch(`/data/${bookObj.id}_${bookObj.name}.json`);
      const bookData = await response.json();

      let row = { name: bookObj.name, rangeTotalWords: 0, rangeTotalChars: 0, verses: {} };
      terms.forEach(t => { row[t] = 0; row.verses[t] = []; });

      Object.keys(bookData).forEach(chNum => {
        const chInt = parseInt(chNum, 10);
        if (range.selectedChapters.includes(chInt)) {
          Object.keys(bookData[chNum]).forEach(vNum => {
            const verseText = bookData[chNum][vNum];
            const words = verseText.split(/\s+/).filter(w => w.length > 0);
            row.rangeTotalWords += words.length;
            row.rangeTotalChars += verseText.length;

            terms.forEach(term => {
              let count = 0;
              if (searchMode === 'exact' || searchMode === 'root') {
                const regex = new RegExp(term, 'g');
                const matches = verseText.match(regex);
                count = matches ? matches.length : 0;
              } else if (searchMode === 'letter') {
                const matches = verseText.split('').filter(c => term.includes(c));
                count = matches.length;
              } else if (searchMode === 'gematria') {
                const gemVal = parseInt(term, 10);
                words.forEach(w => {
                  let sum = 0;
                  for (let i = 0; i < w.length; i++) {
                    sum += (gematriaMap[w[i]] || 0);
                  }
                  if (sum === gemVal) count++;
                });
              }

              if (count > 0) {
                row[term] += count;
                totals[term] += count;
                if (row.verses[term].length < 100) {
                  row.verses[term].push({
                    ref: `${bookObj.he} ${chNum}:${vNum}`,
                    text: verseText,
                    highlights: [term]
                  });
                }
              }
            });
          });
        }
      });

      chartData.push(row);
    }

    self.postMessage({ status: 'success', isEls: false, chartData, totals });
  } catch (error) {
    self.postMessage({ status: 'error', error: error.message });
  }
};