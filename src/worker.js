self.onmessage = async (e) => {
  const { ranges, terms, searchMode, booksList } = e.data;

  try {
    if (searchMode === 'els') {
      const targetTerm = (terms[0] || 'אור').replace(/\s+/g, '');
      const termLetters = targetTerm.split('');
      const termLen = termLetters.length;

      let matches = [];
      const MAX_SKIP = 500; // Upper limit for skip jumps
      const MAX_TOTAL_MATCHES = 20; // Cap total discovered patterns to keep engine fast

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

        // Auto-discover scan across skip intervals (2 to MAX_SKIP)
        for (let skip = 2; skip <= MAX_SKIP; skip++) {
          for (let start = 0; start <= letterSequence.length - (termLen - 1) * skip; start++) {
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
              const padding = 12;
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
                startRef: letterSequence[start].ref,
                width: skip,
                gridLetters
              });

              if (matches.length >= MAX_TOTAL_MATCHES) break;
            }
          }
          if (matches.length >= MAX_TOTAL_MATCHES) break;
        }
        if (matches.length >= MAX_TOTAL_MATCHES) break;
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