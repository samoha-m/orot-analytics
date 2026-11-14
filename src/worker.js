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
  const { ranges, terms, searchMode, booksList, lang, chsStr, elsSubMode, manualConfig, includeSpaces, useAnchor, anchorConfig } = e.data;

  const getBookName = (bookInfo) => {
    if (lang === 'he') return bookInfo.he;
    if (lang === 'fa') return bookInfo.fa;
    return bookInfo.name.replace('_', ' ');
  };

  try {
    let neededBookIds = [...new Set(ranges.map(r => r.bookId))];
    if (searchMode === 'els' && elsSubMode === 'auto' && useAnchor && anchorConfig?.bookId) {
      if (!neededBookIds.includes(anchorConfig.bookId)) {
        neededBookIds.push(anchorConfig.bookId);
      }
    }

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

      // --- MANUAL EXPLORER LOGIC ---
      if (isManual) {
        const { bookId, chapter, verse, letterIdx, skip, count } = manualConfig;
        let letterSequence = [];
        const requiredLetters = skip * count;

        let currentBookIdx = booksList.findIndex(b => b.id === bookId);
        let globalStart = -1;

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
                const rawVerseWords = [...vObj.words];
                const verseString = rawVerseWords.join(' ');

                for (let i = 0; i < verseString.length; i++) {
                    const char = verseString[i];
                    const isValidChar = includeSpaces ? (/[\u0590-\u05FF]/.test(char) || char === ' ') : /[\u0590-\u05FF]/.test(char);

                    if (isValidChar) {
                        const currentGlobalIdx = letterSequence.length;
                        letterSequence.push({
                            char, ref, verseString, charIndexInString: i,
                            bookId: bookInfo.id, c: vObj.c, v: vObj.v
                        });

                        if (globalStart === -1 && bookInfo.id === bookId && vObj.c === chapter && vObj.v === verse) {
                            if (letterCounterInVerse === letterIdx) { globalStart = currentGlobalIdx; }
                            letterCounterInVerse++;
                        }
                    }
                }
            });

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

      // --- AUTO-DISCOVER LOGIC WITH ANCHOR & STRICT LETTER VALIDATION ---
      const targetTerm = (terms[0] || 'אור').replace(/\s+/g, '');
      const termLetters = targetTerm.split('');
      const termLen = termLetters.length;

      let matches = [];
      const MAX_SKIP = 500;
      const MAX_TOTAL_MATCHES = 100;

      let targetRanges = ranges;
      if (useAnchor && anchorConfig?.bookId) {
        targetRanges = [{ id: 'anchor-scope', bookId: anchorConfig.bookId, selectedChapters: Array.from({length: booksList.find(b => b.id === anchorConfig.bookId).maxCh}, (_, i) => i + 1) }];
      }

      for (const range of targetRanges) {
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
        let anchorGlobalIndex = -1;
        let anchorLetterCounter = 0;

        versesList.forEach(vObj => {
            const ref = `${localBookName} ${vObj.c}:${vObj.v}`;
            const verseString = vObj.words.join(' ');
            for (let i = 0; i < verseString.length; i++) {
                const char = verseString[i];
                const isValidChar = includeSpaces ? (/[\u0590-\u05FF]/.test(char) || char === ' ') : /[\u0590-\u05FF]/.test(char);

                if (isValidChar) {
                    const currentIdx = letterSequence.length;
                    letterSequence.push({ char, ref, verseString, charIndexInString: i, globalIndex: currentIdx });

                    if (useAnchor && anchorGlobalIndex === -1 && range.bookId === anchorConfig.bookId && vObj.c === anchorConfig.chapter && vObj.v === anchorConfig.verse) {
                        if (anchorLetterCounter === anchorConfig.letterIdx) {
                            anchorGlobalIndex = currentIdx;
                        }
                        anchorLetterCounter++;
                    }
                }
            }
        });

        // STRICT ANCHOR VALIDATION
        if (useAnchor) {
            if (anchorGlobalIndex === -1) {
                self.postMessage({ status: 'error', error: "Anchor starting coordinate not found in selected scope." });
                return;
            }
            const actualAnchorChar = letterSequence[anchorGlobalIndex].char;
            const expectedFirstChar = termLetters[0];
            if (actualAnchorChar !== expectedFirstChar) {
                self.postMessage({
                    status: 'error',
                    error: `Anchor mismatch: Selected anchor letter is '${actualAnchorChar}', but the search term '${targetTerm}' starts with '${expectedFirstChar}'.`
                });
                return;
            }
        }

        const startIndex = (useAnchor && anchorGlobalIndex !== -1) ? anchorGlobalIndex : 0;

        for (let skip = 2; skip <= MAX_SKIP; skip++) {
          for (let start = startIndex; start < letterSequence.length - (termLen - 1) * skip; start++) {
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

               if (!matches.some(m => m.skip === skip && m.feedNodes[0]?.ref === feedNodes[0]?.ref)) {
                   matches.push({ term: targetTerm, skip, bookName: localBookName, feedNodes });
               }

              if (matches.length >= MAX_TOTAL_MATCHES) break;
            }
          }
          if (matches.length >= MAX_TOTAL_MATCHES) break;
        }
        if (matches.length >= MAX_TOTAL_MATCHES) break;
      }

      matches.sort((a, b) => a.skip - b.skip);
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