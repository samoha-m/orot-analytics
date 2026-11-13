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
  const { ranges, terms, searchMode, booksList, lang, chsStr, elsSubMode, manualConfig } = e.data;

  const getBookName = (bookInfo) => {
    if (lang === 'he') return bookInfo.he;
    if (lang === 'fa') return bookInfo.fa;
    return bookInfo.name.replace('_', ' ');
  };

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

    if (searchMode === 'els') {
      const isManual = elsSubMode === 'manual';

      // --- NEW ARCHITECTURE: MANUAL EXPLORER CROSS-BOOK FETCHING ---
      if (isManual) {
        const { bookId, chapter, verse, letterIdx, skip, count } = manualConfig;
        let letterSequence = [];
        const requiredLetters = skip * count;

        let currentBookIdx = booksList.findIndex(b => b.id === bookId);
        let globalStart = -1;

        // Fetch consecutive books until we have enough letters to complete the manual jump
        while (currentBookIdx < booksList.length) {
            const bookInfo = booksList[currentBookIdx];
            if (!bookCache[bookInfo.id]) {
                const fileName = `/data/${bookInfo.id}_${bookInfo.name.toLowerCase()}.json`;
                const res = await fetch(fileName);
                bookCache[bookInfo.id] = await res.json();
            }
            const bookData = bookCache[bookInfo.id];
            const localBookName = getBookName(bookInfo);

            let currentC = -1, currentV = -1, currentVerseWords = [];
            const versesList = [];
            bookData.forEach(item => {
               if (item.c !== currentC || item.v !== currentV) {
                   if (currentC !== -1) versesList.push({ c: currentC, v: currentV, words: currentVerseWords });
                   currentC = item.c; currentV = item.v; currentVerseWords = [];
               }
               currentVerseWords.push(item.w);
            });
            if (currentVerseWords.length > 0) versesList.push({ c: currentC, v: currentV, words: currentVerseWords });

            let letterCounterInVerse = 0;
            versesList.forEach(vObj => {
                const ref = `${localBookName} ${vObj.c}:${vObj.v}`;
                const verseString = vObj.words.join(' ');
                for (let i = 0; i < verseString.length; i++) {
                    const char = verseString[i];
                    if (/[\u0590-\u05FF]/.test(char)) {
                        const currentGlobalIdx = letterSequence.length;
                        letterSequence.push({
                            char, ref, verseString, charIndexInString: i,
                            bookId: bookInfo.id, c: vObj.c, v: vObj.v
                        });

                        // Locate exact start coordinate
                        if (globalStart === -1 && bookInfo.id === bookId && vObj.c === chapter && vObj.v === verse) {
                            if (letterCounterInVerse === letterIdx) { globalStart = currentGlobalIdx; }
                            letterCounterInVerse++;
                        }
                    }
                }
            });

            // If we found the start AND mapped enough letters across books, stop fetching
            if (globalStart !== -1 && letterSequence.length >= globalStart + requiredLetters) {
                break;
            }
            currentBookIdx++;
        }

        if (globalStart === -1) {
            self.postMessage({ status: 'error', error: "Start coordinate not found. Please ensure valid selection." });
            return;
        }

        let matchIndices = [];
        let generatedTerm = "";
        for (let k = 0; k < count; k++) {
            const idx = globalStart + (k * skip);
            if (idx >= letterSequence.length) break;
            matchIndices.push(idx);
            generatedTerm += letterSequence[idx].char;
        }

        let feedNodes = [];
        let currentRef = null, currentContext = null;

        matchIndices.forEach(globalIdx => {
            const item = letterSequence[globalIdx];
            if (currentRef !== item.ref) {
                if (currentContext) feedNodes.push(currentContext);
                currentRef = item.ref;
                currentContext = { ref: item.ref, text: item.verseString, highlights: [] };
            }
            currentContext.highlights.push(item.charIndexInString);
        });
        if (currentContext) feedNodes.push(currentContext);

        const startItem = letterSequence[globalStart];
        const startBookName = getBookName(booksList.find(b => b.id === startItem.bookId));

        const matches = [{
            term: generatedTerm.split('').join('-'),
            skip,
            bookName: `${startBookName} ${startItem.c}:${startItem.v}`,
            startChar: startItem.char,
            jumpCount: count,
            feedNodes,
            isManual: true
        }];

        self.postMessage({ status: 'success', isEls: true, elsData: { matches } });
        return;
      }

      // --- AUTO-DISCOVER LOGIC ---
      const targetTerm = (terms[0] || 'אור').replace(/\s+/g, '');
      const termLetters = targetTerm.split('');
      const termLen = termLetters.length;

      let matches = [];
      const MAX_SKIP = 500;
      const MAX_TOTAL_MATCHES = 20;

      for (const range of ranges) {
        const bookInfo = booksList.find(b => b.id === range.bookId);
        const localBookName = getBookName(bookInfo);
        const bookData = bookCache[range.bookId] || [];
        const filteredData = bookData.filter(item => range.selectedChapters.includes(item.c));

        const versesList = [];
        let currentVerseWords = [];
        let currentC = -1, currentV = -1;

        filteredData.forEach(item => {
           if (item.c !== currentC || item.v !== currentV) {
               if (currentC !== -1) versesList.push({ c: currentC, v: currentV, words: currentVerseWords });
               currentC = item.c; currentV = item.v; currentVerseWords = [];
           }
           currentVerseWords.push(item.w);
        });
        if (currentVerseWords.length > 0) versesList.push({ c: currentC, v: currentV, words: currentVerseWords });

        let letterSequence = [];
        versesList.forEach(vObj => {
            const ref = `${localBookName} ${vObj.c}:${vObj.v}`;
            const verseString = vObj.words.join(' ');
            for (let i = 0; i < verseString.length; i++) {
                const char = verseString[i];
                if (/[\u0590-\u05FF]/.test(char)) {
                    letterSequence.push({ char, ref, verseString, charIndexInString: i, globalIndex: letterSequence.length });
                }
            }
        });

        for (let skip = 2; skip <= MAX_SKIP; skip++) {
          for (let start = 0; start < letterSequence.length - (termLen - 1) * skip; start++) {
            let matched = true;
            let matchIndices = [];
            for (let k = 0; k < termLen; k++) {
              const idx = start + k * skip;
              if (letterSequence[idx].char !== termLetters[k]) { matched = false; break; }
              matchIndices.push(idx);
            }

            if (matched) {
               let feedNodes = [];
               let currentRef = null, currentContext = null;
               matchIndices.forEach(globalIdx => {
                   const item = letterSequence[globalIdx];
                   if (currentRef !== item.ref) {
                       if (currentContext) feedNodes.push(currentContext);
                       currentRef = item.ref;
                       currentContext = { ref: item.ref, text: item.verseString, highlights: [] };
                   }
                   currentContext.highlights.push(item.charIndexInString);
               });
               if (currentContext) feedNodes.push(currentContext);
               matches.push({ term: targetTerm, skip, bookName: localBookName, feedNodes });
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
      const localBookName = getBookName(bookInfo);

      const rangeHits = {};
      const matchedVerses = {};
      let rangeTotalWords = 0, rangeTotalChars = 0;

      terms.forEach(term => { rangeHits[term] = 0; matchedVerses[term] = []; });
      const filteredData = bookData.filter(item => range.selectedChapters.includes(item.c));
      const verses = {};

      for (let i = 0; i < filteredData.length; i++) {
        const item = filteredData[i];
        rangeTotalWords += 1;
        rangeTotalChars += item.w.length;

        const vKey = `${item.c}:${item.v}`;
        if (!verses[vKey]) verses[vKey] = { text: [], matches: new Set(), highlights: new Set() };
        verses[vKey].text.push(item.w);

        parsedTerms.forEach(pt => {
          let matchedStrings = [], isMatch = false;
          if (searchMode === 'exact') {
            isMatch = true;
            for(let j = 0; j < pt.words.length; j++) {
                if (!filteredData[i + j] || filteredData[i + j].w !== pt.words[j]) { isMatch = false; break; }
            }
            if (isMatch) matchedStrings.push(pt.original);
          }
          else if (searchMode === 'root') {
            if (item.r && item.r.includes(pt.original)) { isMatch = true; matchedStrings.push(item.w); }
          }
          else if (searchMode === 'letter') {
            const hitsInWord = item.w.split(pt.original).length - 1;
            if (hitsInWord > 0) { isMatch = true; matchedStrings.push(pt.original); }
          }
          else if (searchMode === 'gematria') {
            if (pt.isNumber && calculateGematria(item.w) === Number(pt.original)) { isMatch = true; matchedStrings.push(item.w); }
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
               matchedVerses[term].push({ ref: `${localBookName} ${vKey.replace(':', ' ')}`, text: verseText, highlights: Array.from(verseObj.highlights) });
            }
          });
        }
      });

      return {
        name: `${localBookName} (${range.selectedChapters.length} ${chsStr})`,
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