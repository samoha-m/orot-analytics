const bookCache = {};

const gematriaMap = {
  'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
  'י': 10, 'כ': 20, 'ך': 20, 'ל': 30, 'מ': 40, 'ם': 40, 'נ': 50, 'ן': 50,
  'ס': 60, 'ע': 70, 'פ': 80, 'ף': 80, 'צ': 90, 'ץ': 90,
  'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400
};

const calculateGematria = (word) => {
  let sum = 0;
  for (let i = 0; i < word.length; i++) { sum += gematriaMap[word[i]] || 0; }
  return sum;
};

self.onmessage = async (e) => {
  const { ranges, terms, searchMode, booksList } = e.data;

  try {
    const neededBookIds = [...new Set(ranges.map(r => r.bookId))];
    for (const id of neededBookIds) {
      if (!bookCache[id]) {
        const bookInfo = booksList.find(b => b.id === id);
        const fileName = `/data/${bookInfo.id}_${bookInfo.name.toLowerCase()}.json`;
        const res = await fetch(fileName);
        bookCache[id] = await res.json();
      }
    }

    // ==========================================
    // ELS AUTO-DISCOVER LOGIC
    // ==========================================
    if (searchMode === 'els') {
      const targetTerm = (terms[0] || 'אור').replace(/\s+/g, '');
      const termLetters = targetTerm.split('');
      const termLen = termLetters.length;

      let matches = [];
      const MAX_SKIP = 500;
      const MAX_TOTAL_MATCHES = 20;

      for (const range of ranges) {
        const bookInfo = booksList.find(b => b.id === range.bookId);
        const bookData = bookCache[range.bookId] || [];
        const filteredData = bookData.filter(item => range.selectedChapters.includes(item.c));

        let letterSequence = [];
        for (let i = 0; i < filteredData.length; i++) {
          const item = filteredData[i];
          for (let j = 0; j < item.w.length; j++) {
            const char = item.w[j];
            if (/[\u0590-\u05FF]/.test(char)) {

              // NEW: Detect exact word and verse boundaries for the UI reader
              const isEndOfWord = (j === item.w.length - 1);
              const isEndOfVerse = (isEndOfWord && i < filteredData.length - 1 && (filteredData[i+1].v !== item.v || filteredData[i+1].c !== item.c));

              letterSequence.push({
                char,
                ref: `${bookInfo.he} ${item.c}:${item.v}`,
                letterIdx: letterSequence.length,
                isEndOfWord,
                isEndOfVerse
              });
            }
          }
        }

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
              const padding = 35; // Expand context padding to show full readable sentences
              const gridStart = Math.max(0, start - padding);
              const gridEnd = Math.min(letterSequence.length, start + (termLen - 1) * skip + padding + 1);
              const gridLetters = letterSequence.slice(gridStart, gridEnd).map((item, idx) => ({
                ...item,
                isMatch: matchIndices.includes(gridStart + idx)
              }));

              matches.push({
                term: targetTerm,
                skip,
                bookName: bookInfo.name,
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

    // ==========================================
    // STANDARD SEARCH LOGIC
    // ==========================================
    const totals = {};
    terms.forEach(term => totals[term] = 0);

    const parsedTerms = terms.map(t => ({
        original: t,
        words: t.split(' ').filter(w => w),
        isNumber: !isNaN(Number(t)) && t.trim() !== ''
    }));

    const formattedChartData = ranges.map((range) => {
      const bookData = bookCache[range.bookId] || [];
      const bookInfo = booksList.find(b => b.id === range.bookId);

      const rangeHits = {};
      const matchedVerses = {};
      let rangeTotalWords = 0;
      let rangeTotalChars = 0;

      terms.forEach(term => {
        rangeHits[term] = 0;
        matchedVerses[term] = [];
      });

      const filteredData = bookData.filter(item => range.selectedChapters.includes(item.c));
      const verses = {};

      for (let i = 0; i < filteredData.length; i++) {
        const item = filteredData[i];
        rangeTotalWords += 1;
        rangeTotalChars += item.w.length;

        const vKey = `${item.c}:${item.v}`;
        if (!verses[vKey]) {
          verses[vKey] = { text: [], matches: new Set(), highlights: new Set() };
        }
        verses[vKey].text.push(item.w);

        parsedTerms.forEach(pt => {
          let matchedStrings = [];
          let isMatch = false;

          if (searchMode === 'exact') {
            isMatch = true;
            for(let j = 0; j < pt.words.length; j++) {
                if (!filteredData[i + j] || filteredData[i + j].w !== pt.words[j]) {
                    isMatch = false;
                    break;
                }
            }
            if (isMatch) matchedStrings.push(pt.original);
          }
          else if (searchMode === 'root') {
            if (item.r && item.r.includes(pt.original)) {
                isMatch = true;
                matchedStrings.push(item.w);
            }
          }
          else if (searchMode === 'letter') {
            const hitsInWord = item.w.split(pt.original).length - 1;
            if (hitsInWord > 0) {
                isMatch = true;
                matchedStrings.push(pt.original);
            }
          }
          else if (searchMode === 'gematria') {
            if (pt.isNumber && calculateGematria(item.w) === Number(pt.original)) {
                isMatch = true;
                matchedStrings.push(item.w);
            }
          }

          if (isMatch) {
            const hitCount = (searchMode === 'letter') ? (item.w.split(pt.original).length - 1) : 1;
            rangeHits[pt.original] += hitCount;
            totals[pt.original] += hitCount;

            verses[vKey].matches.add(pt.original);
            matchedStrings.forEach(str => verses[vKey].highlights.add(str));
          }
        });
      }

      Object.keys(verses).forEach(vKey => {
        const verseObj = verses[vKey];
        if (verseObj.matches.size > 0) {
          const verseText = verseObj.text.join(" ");
          verseObj.matches.forEach(term => {
            if (matchedVerses[term].length < 100) {
               matchedVerses[term].push({
                 ref: `${bookInfo.he} ${vKey.replace(':', ' ')}`,
                 text: verseText,
                 highlights: Array.from(verseObj.highlights)
               });
            }
          });
        }
      });

      return {
        name: `${bookInfo.he} (${range.selectedChapters.length} Chs)`,
        verses: matchedVerses,
        rangeTotalWords,
        rangeTotalChars,
        ...rangeHits
      };
    });

    self.postMessage({ status: 'success', isEls: false, chartData: formattedChartData, totals });

  } catch (error) {
    self.postMessage({ status: 'error', error: error.message });
  }
};