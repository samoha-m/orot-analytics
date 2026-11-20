import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import './App.css';
import { translations } from './translations';
import { booksList, COLORS } from './data/constants';
import ControlSidebar from './components/ControlSidebar';
import ChartDisplay from './components/ChartDisplay';
import ELSFeedView from './components/ELSFeedView';
import { useAndroidBackExit } from './hooks/useAndroidBackExit.jsx';

const FINAL_LETTER_MAP = {
  'ך': 'כ',
  'ם': 'מ',
  'ן': 'נ',
  'ף': 'פ',
  'ץ': 'צ'
};

const GEMATRIA_VALUES = {
  'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
  'י': 10, 'כ': 20, 'ך': 20, 'ל': 30, 'מ': 40, 'ם': 40, 'נ': 50, 'ן': 50,
  'ס': 60, 'ע': 70, 'פ': 80, 'ף': 80, 'צ': 90, 'ץ': 90,
  'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400
};

const HEBREW_PREFIXES = ['ו', 'ה', 'ב', 'כ', 'ל', 'מ', 'ש', 'וה', 'וב', 'וכ', 'ול', 'ומ', 'וש', 'מה', 'שה', 'כש', 'לכ'];
const HEBREW_SUFFIXES = ['ים', 'ות', 'ה', 'י', 'ך', 'ו', 'הם', 'הן', 'נו', 'תי', 'תם', 'תן', 'כם', 'כן'];

function stripNiqqud(str = '') {
  return String(str).replace(/[\u0591-\u05C7]/g, '');
}

function normalizeHebrew(str = '') {
  return stripNiqqud(str)
    .replace(/[^\u05D0-\u05EA\s]/g, '')
    .split('')
    .map((ch) => FINAL_LETTER_MAP[ch] || ch)
    .join('')
    .trim();
}

function extractHebrewLetters(str = '') {
  return stripNiqqud(str)
    .replace(/[^\u05D0-\u05EA]/g, '')
    .split('')
    .map((ch) => FINAL_LETTER_MAP[ch] || ch)
    .join('');
}

function calculateGematria(str = '') {
  const clean = stripNiqqud(str);
  let sum = 0;
  for (let i = 0; i < clean.length; i++) {
    sum += GEMATRIA_VALUES[clean[i]] || 0;
  }
  return sum;
}

function matchesHebrewRoot(wordNorm, rootNorm) {
  if (!wordNorm || !rootNorm) return false;
  if (wordNorm === rootNorm) return true;
  if (rootNorm.length < 2 || wordNorm.length < rootNorm.length) return false;

  const candidates = [wordNorm];
  for (const pref of HEBREW_PREFIXES) {
    if (wordNorm.startsWith(pref) && wordNorm.length - pref.length >= rootNorm.length) {
      candidates.push(wordNorm.slice(pref.length));
    }
  }

  for (const cand of candidates) {
    if (cand === rootNorm) return true;
    for (const suf of HEBREW_SUFFIXES) {
      if (cand.endsWith(suf) && cand.slice(0, -suf.length) === rootNorm) {
        return true;
      }
    }
  }
  return false;
}

function buildInitialRanges() {
  return booksList.map((b) => ({
    bookId: b.id,
    selectedChapters: Array.from({ length: b.maxCh || 1 }, (_, i) => i + 1)
  }));
}

function App() {
  const [lang, setLang] = useState('he');
  const [mobileView, setMobileView] = useState('search');

  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState('exact');
  const [acronymPosition, setAcronymPosition] = useState('first');
  const [elsSubMode, setElsSubMode] = useState('auto');
  const [includeSpaces, setIncludeSpaces] = useState(false);

  const [manualConfig, setManualConfig] = useState({
    bookId: '01',
    chapter: 1,
    verse: 1,
    letterIdx: null,
    skip: 50,
    count: 5
  });

  const [anchorConfig, setAnchorConfig] = useState({
    bookId: '01',
    chapter: 1,
    verse: 1,
    letterIdx: null
  });

  // Scopes & UI Overlays
  const [ranges, setRanges] = useState(buildInitialRanges);
  const [isScopeOpen, setIsScopeOpen] = useState(false);
  const [expandedBookId, setExpandedBookId] = useState('01');
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Results State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resultTotals, setResultTotals] = useState(null);
  const [rawChartData, setRawChartData] = useState([]);
  const [activeTerms, setActiveTerms] = useState([]);
  const [viewMode, setViewMode] = useState('absolute');
  const [activePreview, setActivePreview] = useState(null);
  const [elsData, setElsData] = useState(null);

  const bookCacheRef = useRef({});
  const isRTL = lang === 'he' || lang === 'fa';

  const t = useCallback(
    (key) => {
      const dict = translations[lang] || translations.en;
      return dict[key] !== undefined ? dict[key] : translations.en[key] || key;
    },
    [lang]
  );

  const getBookLabel = useCallback(
    (book) => {
      if (!book) return '';
      if (lang === 'he') return book.he;
      if (lang === 'fa') return book.fa;
      return book.name.replace('_', ' ');
    },
    [lang]
  );

  // Sync document direction with selected language
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [isRTL, lang]);

  // Android Back Button & Two-Tap Exit Handler
  const { ExitToast } = useAndroidBackExit({
    isInfoOpen,
    setIsInfoOpen,
    isScopeOpen,
    setIsScopeOpen,
    mobileView,
    setMobileView,
    exitMessage: t('pressBackAgainToExit') || 'Press back again to exit',
    isRTL
  });

  const fetchBookData = useCallback(async (bookId) => {
    if (bookCacheRef.current[bookId]) {
      return bookCacheRef.current[bookId];
    }
    const bookInfo = booksList.find((b) => b.id === bookId);
    if (!bookInfo) return [];
    const res = await fetch(`/data/${bookInfo.id}_${bookInfo.name.toLowerCase()}.json`);
    const data = await res.json();
    bookCacheRef.current[bookId] = data;
    return data;
  }, []);

  const handleResetApp = () => {
    setSearchTerm('');
    setResultTotals(null);
    setRawChartData([]);
    setActiveTerms([]);
    setActivePreview(null);
    setElsData(null);
    setErrorMsg('');
    setIsScopeOpen(false);
    setIsInfoOpen(false);
    setMobileView('search');
  };

  // Scope Selection Helpers
  const handleSelectAllBooks = () => {
    setRanges(buildInitialRanges());
  };

  const handleClearAllBooks = () => {
    setRanges(booksList.map((b) => ({ bookId: b.id, selectedChapters: [] })));
  };

  const toggleBookAllChapters = (book) => {
    setRanges((prev) =>
      prev.map((r) => {
        if (r.bookId !== book.id) return r;
        const allSelected = r.selectedChapters.length === book.maxCh;
        return {
          ...r,
          selectedChapters: allSelected
            ? []
            : Array.from({ length: book.maxCh }, (_, i) => i + 1)
        };
      })
    );
  };

  const toggleSingleChapter = (bookId, chapterNum) => {
    setRanges((prev) =>
      prev.map((r) => {
        if (r.bookId !== bookId) return r;
        const exists = r.selectedChapters.includes(chapterNum);
        const nextChapters = exists
          ? r.selectedChapters.filter((c) => c !== chapterNum)
          : [...r.selectedChapters, chapterNum].sort((a, b) => a - b);
        return { ...r, selectedChapters: nextChapters };
      })
    );
  };

  // Build Continuous Character Stream for Skip / ELS Analysis
  const buildBookStream = (bookWords, selectedChapterSet, withSpaces) => {
    const verseMap = new Map();
    for (let i = 0; i < bookWords.length; i++) {
      const item = bookWords[i];
      if (selectedChapterSet && !selectedChapterSet.has(item.c)) continue;
      const key = `${item.c}:${item.v}`;
      if (!verseMap.has(key)) {
        verseMap.set(key, { c: item.c, v: item.v, words: [] });
      }
      verseMap.get(key).words.push(item.w);
    }

    const verses = Array.from(verseMap.values()).map((vObj) => ({
      c: vObj.c,
      v: vObj.v,
      text: vObj.words.join(' ')
    }));

    const stream = [];
    for (let vIdx = 0; vIdx < verses.length; vIdx++) {
      const vText = verses[vIdx].text;
      let letterOrdinalInVerse = 0;

      for (let cIdx = 0; cIdx < vText.length; cIdx++) {
        const rawChar = vText[cIdx];
        if (/[\u0590-\u05FF]/.test(rawChar)) {
          if (/[\u05D0-\u05EA]/.test(rawChar)) {
            stream.push({
              normChar: FINAL_LETTER_MAP[rawChar] || rawChar,
              rawChar,
              verseIdx: vIdx,
              charIdx: cIdx,
              letterOrdinal: letterOrdinalInVerse++
            });
          }
        } else if (withSpaces && rawChar === ' ') {
          stream.push({
            normChar: ' ',
            rawChar: ' ',
            verseIdx: vIdx,
            charIdx: cIdx,
            letterOrdinal: -1
          });
        }
      }

      if (withSpaces && vIdx < verses.length - 1) {
        stream.push({
          normChar: ' ',
          rawChar: ' ',
          verseIdx: vIdx,
          charIdx: vText.length,
          letterOrdinal: -1
        });
      }
    }

    return { verses, stream };
  };

  const buildFeedNodesFromIndices = (bookLabel, verses, stream, matchedIndices) => {
    const byVerse = new Map();
    for (const sIdx of matchedIndices) {
      const node = stream[sIdx];
      if (!node) continue;
      if (!byVerse.has(node.verseIdx)) {
        byVerse.set(node.verseIdx, []);
      }
      byVerse.get(node.verseIdx).push(node.charIdx);
    }

    const orderedVerseIndices = Array.from(byVerse.keys()).sort((a, b) => a - b);
    return orderedVerseIndices.map((vIdx) => {
      const vObj = verses[vIdx];
      return {
        ref: `${bookLabel} ${vObj.c}:${vObj.v}`,
        text: vObj.text,
        highlights: byVerse.get(vIdx)
      };
    });
  };

  // Main Analysis Execution
  const handleSearch = async (overrides = {}) => {
    const effectiveAcronymPos = overrides.acronymPosition || acronymPosition;
    setErrorMsg('');
    setIsScopeOpen(false);

    // 1. SKIP / LETTER-SEQUENCE MODES
    if (searchMode === 'els') {
      if (elsSubMode === 'manual') {
        if (manualConfig.letterIdx === null || manualConfig.letterIdx === undefined) {
          setErrorMsg(t('errorSelectLetter'));
          return;
        }
        setLoading(true);
        if (window.innerWidth <= 768) setMobileView('results');

        try {
          const bookInfo = booksList.find((b) => b.id === manualConfig.bookId);
          const bookLabel = getBookLabel(bookInfo);
          const rawWords = await fetchBookData(bookInfo.id);
          const { verses, stream } = buildBookStream(rawWords, null, includeSpaces);

          const startStreamIdx = stream.findIndex(
            (s) =>
              verses[s.verseIdx].c === manualConfig.chapter &&
              verses[s.verseIdx].v === manualConfig.verse &&
              s.letterOrdinal === manualConfig.letterIdx
          );

          if (startStreamIdx === -1) {
            setErrorMsg(t('errStartNotFound'));
            setLoading(false);
            return;
          }

          const step = Number(manualConfig.skip) || 1;
          const count = Math.max(1, Math.min(100, Number(manualConfig.count) || 1));
          const indices = [];
          let collectedChars = '';

          for (let k = 0; k < count; k++) {
            const targetIdx = startStreamIdx + k * step;
            if (targetIdx < 0 || targetIdx >= stream.length) break;
            indices.push(targetIdx);
            collectedChars += stream[targetIdx].rawChar;
          }

          const feedNodes = buildFeedNodesFromIndices(bookLabel, verses, stream, indices);
          setElsData({
            matches: [
              {
                isManual: true,
                term: collectedChars,
                bookName: `${bookLabel} ${manualConfig.chapter}:${manualConfig.verse}`,
                startChar: stream[startStreamIdx].rawChar,
                skip: step,
                jumpCount: indices.length,
                feedNodes
              }
            ]
          });
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
        return;
      }

      const rawTarget = searchTerm.split(',')[0]?.trim() || '';
      const targetSeq = includeSpaces
        ? normalizeHebrew(rawTarget).replace(/\s+/g, ' ')
        : extractHebrewLetters(rawTarget);

      if (!targetSeq) {
        setErrorMsg(t('errorEmptyInput'));
        return;
      }

      if (elsSubMode === 'anchor') {
        if (anchorConfig.letterIdx === null || anchorConfig.letterIdx === undefined) {
          setErrorMsg(t('errorSelectLetter'));
          return;
        }

        setLoading(true);
        if (window.innerWidth <= 768) setMobileView('results');

        try {
          const bookInfo = booksList.find((b) => b.id === anchorConfig.bookId);
          const bookLabel = getBookLabel(bookInfo);
          const rawWords = await fetchBookData(bookInfo.id);
          const { verses, stream } = buildBookStream(rawWords, null, includeSpaces);

          const anchorStreamIdx = stream.findIndex(
            (s) =>
              verses[s.verseIdx].c === anchorConfig.chapter &&
              verses[s.verseIdx].v === anchorConfig.verse &&
              s.letterOrdinal === anchorConfig.letterIdx
          );

          if (anchorStreamIdx === -1) {
            setErrorMsg(t('errAnchorNotFound'));
            setLoading(false);
            return;
          }

          const actualAnchor = stream[anchorStreamIdx].normChar;
          if (actualAnchor !== targetSeq[0]) {
            const mismatchFn = t('errAnchorMismatch');
            setErrorMsg(
              typeof mismatchFn === 'function'
                ? mismatchFn(stream[anchorStreamIdx].rawChar, rawTarget, rawTarget[0])
                : `Anchor letter mismatch`
            );
            setLoading(false);
            return;
          }

          const len = targetSeq.length;
          const found = [];

          if (len === 1) {
            found.push({
              term: rawTarget,
              bookName: bookLabel,
              skip: 1,
              feedNodes: buildFeedNodesFromIndices(bookLabel, verses, stream, [anchorStreamIdx])
            });
          } else {
            const maxForward = Math.floor((stream.length - 1 - anchorStreamIdx) / (len - 1));
            const maxBackward = Math.floor(anchorStreamIdx / (len - 1));
            const maxAbsSkip = Math.min(2500, Math.max(maxForward, maxBackward));

            for (let absSkip = 1; absSkip <= maxAbsSkip; absSkip++) {
              for (const dir of [1, -1]) {
                const skip = absSkip * dir;
                const endIdx = anchorStreamIdx + (len - 1) * skip;
                if (endIdx < 0 || endIdx >= stream.length) continue;

                let ok = true;
                for (let k = 1; k < len; k++) {
                  if (stream[anchorStreamIdx + k * skip].normChar !== targetSeq[k]) {
                    ok = false;
                    break;
                  }
                }

                if (ok) {
                  const indices = Array.from({ length: len }, (_, k) => anchorStreamIdx + k * skip);
                  found.push({
                    term: rawTarget,
                    bookName: bookLabel,
                    skip,
                    feedNodes: buildFeedNodesFromIndices(bookLabel, verses, stream, indices)
                  });
                }
              }
              if (found.length >= 150) break;
            }
          }

          setElsData({ matches: found });
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
        return;
      }

      // Auto-Discover across selected ranges
      const activeRanges = ranges.filter((r) => r.selectedChapters.length > 0);
      if (activeRanges.length === 0) {
        setErrorMsg(t('errorSelectChapter'));
        return;
      }

      setLoading(true);
      if (window.innerWidth <= 768) setMobileView('results');

      try {
        const allMatches = [];
        const len = targetSeq.length;
        const maxSkipBound = activeRanges.length > 5 ? 300 : 800;

        for (const r of activeRanges) {
          const bookInfo = booksList.find((b) => b.id === r.bookId);
          const bookLabel = getBookLabel(bookInfo);
          const rawWords = await fetchBookData(bookInfo.id);
          const chSet = new Set(r.selectedChapters);
          const { verses, stream } = buildBookStream(rawWords, chSet, includeSpaces);

          if (stream.length === 0) continue;

          if (len === 1) {
            for (let i = 0; i < stream.length && allMatches.length < 150; i++) {
              if (stream[i].normChar === targetSeq[0]) {
                allMatches.push({
                  term: rawTarget,
                  bookName: bookLabel,
                  skip: 1,
                  absSkip: 1,
                  feedNodes: buildFeedNodesFromIndices(bookLabel, verses, stream, [i])
                });
              }
            }
            continue;
          }

          const firstChar = targetSeq[0];
          const lastChar = targetSeq[len - 1];

          for (let i = 0; i < stream.length; i++) {
            if (stream[i].normChar !== firstChar) continue;

            const maxFwd = Math.min(maxSkipBound, Math.floor((stream.length - 1 - i) / (len - 1)));
            for (let skip = 1; skip <= maxFwd; skip++) {
              if (stream[i + (len - 1) * skip].normChar !== lastChar) continue;
              let ok = true;
              for (let k = 1; k < len - 1; k++) {
                if (stream[i + k * skip].normChar !== targetSeq[k]) {
                  ok = false;
                  break;
                }
              }
              if (ok) {
                const indices = Array.from({ length: len }, (_, k) => i + k * skip);
                allMatches.push({
                  term: rawTarget,
                  bookName: bookLabel,
                  skip,
                  absSkip: skip,
                  feedNodes: buildFeedNodesFromIndices(bookLabel, verses, stream, indices)
                });
              }
            }

            const maxBwd = Math.min(maxSkipBound, Math.floor(i / (len - 1)));
            for (let absSkip = 1; absSkip <= maxBwd; absSkip++) {
              const skip = -absSkip;
              if (stream[i + (len - 1) * skip].normChar !== lastChar) continue;
              let ok = true;
              for (let k = 1; k < len - 1; k++) {
                if (stream[i + k * skip].normChar !== targetSeq[k]) {
                  ok = false;
                  break;
                }
              }
              if (ok) {
                const indices = Array.from({ length: len }, (_, k) => i + k * skip);
                allMatches.push({
                  term: rawTarget,
                  bookName: bookLabel,
                  skip,
                  absSkip,
                  feedNodes: buildFeedNodesFromIndices(bookLabel, verses, stream, indices)
                });
              }
            }

            if (allMatches.length >= 250) break;
          }
        }

        allMatches.sort((a, b) => a.absSkip - b.absSkip);
        setElsData({ matches: allMatches.slice(0, 150) });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2. CHART MODES (Exact, Root, Letter, Acronym, Gematria)
    const parsedTerms = searchTerm
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (parsedTerms.length === 0) {
      setErrorMsg(t('errorEmptyInput'));
      return;
    }

    const activeRanges = ranges.filter((r) => r.selectedChapters.length > 0);
    if (activeRanges.length === 0) {
      setErrorMsg(t('errorSelectChapter'));
      return;
    }

    setLoading(true);
    setActivePreview(null);
    if (window.innerWidth <= 768) setMobileView('results');

    try {
      const totals = {};
      parsedTerms.forEach((term) => {
        totals[term] = 0;
      });

      const preparedTerms = parsedTerms.map((raw) => {
        const norm = normalizeHebrew(raw);
        const letters = extractHebrewLetters(raw);
        const words = norm.split(/\s+/).filter(Boolean);
        const gemTarget = /^\d+$/.test(raw) ? Number(raw) : calculateGematria(raw);
        return { raw, norm, letters, words, gemTarget };
      });

      const rows = [];

      for (const r of activeRanges) {
        const bookInfo = booksList.find((b) => b.id === r.bookId);
        const bookLabel = getBookLabel(bookInfo);
        const rawWords = await fetchBookData(bookInfo.id);
        const chSet = new Set(r.selectedChapters);

        const verseMap = new Map();
        let totalWordsInScope = 0;

        for (let i = 0; i < rawWords.length; i++) {
          const item = rawWords[i];
          if (!chSet.has(item.c)) continue;
          totalWordsInScope++;
          const key = `${item.c}:${item.v}`;
          if (!verseMap.has(key)) {
            verseMap.set(key, { c: item.c, v: item.v, items: [] });
          }
          verseMap.get(key).items.push(item);
        }

        const row = {
          name: bookLabel,
          totalWords: totalWordsInScope,
          verses: []
        };

        preparedTerms.forEach((pt) => {
          row[pt.raw] = 0;
        });

        for (const vObj of verseMap.values()) {
          const normWords = vObj.items.map((it) => normalizeHebrew(it.w));
          const verseText = vObj.items.map((it) => it.w).join(' ');
          const matchedWordIndices = new Set();
          const acronymLetterMap = new Map();
          let targetLetterChar = '';
          let verseMatched = false;

          for (const pt of preparedTerms) {
            let hitsInVerse = 0;

            if (searchMode === 'exact') {
              const pLen = pt.words.length;
              if (pLen === 1) {
                normWords.forEach((nw, idx) => {
                  if (nw === pt.words[0]) {
                    hitsInVerse++;
                    matchedWordIndices.add(idx);
                  }
                });
              } else if (pLen > 1) {
                for (let idx = 0; idx <= normWords.length - pLen; idx++) {
                  let seqMatch = true;
                  for (let k = 0; k < pLen; k++) {
                    if (normWords[idx + k] !== pt.words[k]) {
                      seqMatch = false;
                      break;
                    }
                  }
                  if (seqMatch) {
                    hitsInVerse++;
                    for (let k = 0; k < pLen; k++) matchedWordIndices.add(idx + k);
                  }
                }
              }
            } else if (searchMode === 'root') {
              normWords.forEach((nw, idx) => {
                const rawRoot = vObj.items[idx].r ? normalizeHebrew(vObj.items[idx].r) : '';
                const isHit = rawRoot
                  ? rawRoot === pt.norm
                  : matchesHebrewRoot(nw, pt.norm);
                if (isHit) {
                  hitsInVerse++;
                  matchedWordIndices.add(idx);
                }
              });
            } else if (searchMode === 'letter') {
              const targetChar = pt.letters[0];
              if (targetChar) {
                targetLetterChar = targetChar;
                vObj.items.forEach((it, idx) => {
                  const wLetters = extractHebrewLetters(it.w);
                  let cCount = 0;
                  for (let c = 0; c < wLetters.length; c++) {
                    if (wLetters[c] === targetChar) cCount++;
                  }
                  if (cCount > 0) {
                    hitsInVerse += cCount;
                    matchedWordIndices.add(idx);
                  }
                });
              }
            } else if (searchMode === 'acronym') {
              const seq = pt.letters;
              const sLen = seq.length;
              if (sLen > 0 && normWords.length >= sLen) {
                for (let idx = 0; idx <= normWords.length - sLen; idx++) {
                  let ok = true;
                  for (let k = 0; k < sLen; k++) {
                    const wLetters = extractHebrewLetters(vObj.items[idx + k].w);
                    const edgeLetter =
                      effectiveAcronymPos === 'last'
                        ? wLetters[wLetters.length - 1]
                        : wLetters[0];
                    if (edgeLetter !== seq[k]) {
                      ok = false;
                      break;
                    }
                  }
                  if (ok) {
                    hitsInVerse++;
                    for (let k = 0; k < sLen; k++) {
                      matchedWordIndices.add(idx + k);
                      acronymLetterMap.set(idx + k, effectiveAcronymPos);
                    }
                  }
                }
              }
            } else if (searchMode === 'gematria') {
              if (pt.gemTarget > 0) {
                vObj.items.forEach((it, idx) => {
                  if (calculateGematria(it.w) === pt.gemTarget) {
                    hitsInVerse++;
                    matchedWordIndices.add(idx);
                  }
                });
              }
            }

            if (hitsInVerse > 0) {
              row[pt.raw] += hitsInVerse;
              totals[pt.raw] += hitsInVerse;
              verseMatched = true;
            }
          }

          if (verseMatched && row.verses.length < 100) {
            row.verses.push({
              ref: `${bookLabel} ${vObj.c}:${vObj.v}`,
              text: verseText,
              words: vObj.items.map((it) => it.w),
              matchedWordIndices: Array.from(matchedWordIndices),
              acronymLetterMap: Object.fromEntries(acronymLetterMap),
              targetLetterChar
            });
          }
        }

        rows.push(row);
      }

      setActiveTerms(parsedTerms);
      setRawChartData(rows);
      setResultTotals(totals);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Compute Absolute or Relative % Chart Data
  const renderChartData = useMemo(() => {
    if (!rawChartData || rawChartData.length === 0) return [];
    if (viewMode === 'absolute') return rawChartData;

    return rawChartData.map((row) => {
      const nextRow = { ...row };
      const denom = row.totalWords || 1;
      activeTerms.forEach((term) => {
        const rawVal = row[term] || 0;
        nextRow[term] = Number(((rawVal / denom) * 100).toFixed(3));
      });
      return nextRow;
    });
  }, [rawChartData, viewMode, activeTerms]);

  const minComfortableWidth = useMemo(() => {
    return Math.max(480, renderChartData.length * Math.max(95, activeTerms.length * 44));
  }, [renderChartData.length, activeTerms.length]);

  const handleExportCSV = () => {
    if (!renderChartData || renderChartData.length === 0) return;
    const BOM = '\uFEFF';
    const headers = ['Book', ...activeTerms.map((term) => (viewMode === 'relative' ? `${term} (%)` : term))];
    const lines = [headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(',')];

    renderChartData.forEach((row) => {
      const vals = [
        `"${String(row.name).replace(/"/g, '""')}"`,
        ...activeTerms.map((term) => row[term] ?? 0)
      ];
      lines.push(vals.join(','));
    });

    const blob = new Blob([BOM + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orot_analysis_${searchMode}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderHighlightedVerseWords = (verseObj) => {
    const matchedSet = new Set(verseObj.matchedWordIndices || []);
    return (verseObj.words || []).map((word, idx) => {
      const isMatched = matchedSet.has(idx);
      if (!isMatched) {
        return <span key={idx}>{word} </span>;
      }

      if (searchMode === 'acronym' && verseObj.acronymLetterMap?.[idx]) {
        const pos = verseObj.acronymLetterMap[idx];
        const chars = word.split('');
        const targetCharIdx = pos === 'last' ? chars.length - 1 : 0;
        return (
          <span key={idx} className="highlight-match">
            {chars.map((ch, cIdx) =>
              cIdx === targetCharIdx ? (
                <span key={cIdx} className="acronym-letter">
                  {ch}
                </span>
              ) : (
                <span key={cIdx}>{ch}</span>
              )
            )}{' '}
          </span>
        );
      }

      if (searchMode === 'letter' && verseObj.targetLetterChar) {
        return (
          <span key={idx}>
            {word.split('').map((ch, cIdx) => {
              const normCh = FINAL_LETTER_MAP[ch] || ch;
              return normCh === verseObj.targetLetterChar ? (
                <span key={cIdx} className="highlight-match">
                  {ch}
                </span>
              ) : (
                <span key={cIdx}>{ch}</span>
              );
            })}{' '}
          </span>
        );
      }

      return (
        <span key={idx} className="highlight-match">
          {word}{' '}
        </span>
      );
    });
  };

  return (
    <div className="app-container" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Navigation Header */}
      <header className="top-navbar">
        <div
          className="top-navbar-brand"
          onClick={handleResetApp}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleResetApp();
          }}
        >
          <img src="/logo192.png" alt="OROT" className="top-navbar-logo" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#1e3a8a', letterSpacing: '0.5px' }}>
              OROT
            </span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>
              אורות
            </span>
          </div>
        </div>

        {/* Language Switcher & Info Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: '#f1f5f9',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}
          >
            {[
              { code: 'he', label: 'עב' },
              { code: 'en', label: 'EN' },
              { code: 'fa', label: 'فا' }
            ].map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setLang(item.code)}
                style={{
                  border: 'none',
                  padding: '5px 9px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: lang === item.code ? '700' : '500',
                  backgroundColor: lang === item.code ? '#ffffff' : 'transparent',
                  color: lang === item.code ? '#1d4ed8' : '#64748b',
                  boxShadow: lang === item.code ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsInfoOpen(true)}
            aria-label={t('infoTitle')}
            title={t('infoTitle')}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#1e3a8a',
              fontWeight: '800',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            i
          </button>
        </div>
      </header>

      {/* Main Split / Mobile Full-Screen Workspace */}
      <div className="app-layout">
        <main className={`main-canvas ${mobileView === 'results' ? 'mobile-active' : 'mobile-hidden'}`}>
          {/* Mobile Back-to-Search Header */}
          <div className="mobile-back-bar">
            <button
              type="button"
              className="mobile-back-btn"
              onClick={() => setMobileView('search')}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }}
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>{t('backToSearch') || t('editSearch')}</span>
            </button>
          </div>

          {/* Validation Error Banner */}
          {errorMsg && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '16px'
              }}
            >
              {errorMsg}
            </div>
          )}

          {searchMode === 'els' ? (
            <ELSFeedView elsData={elsData} loading={loading} t={t} lang={lang} />
          ) : (
            <>
              <ChartDisplay
                resultTotals={resultTotals}
                loading={loading}
                activeTerms={activeTerms}
                searchMode={searchMode}
                viewMode={viewMode}
                setViewMode={setViewMode}
                handleExportCSV={handleExportCSV}
                minComfortableWidth={minComfortableWidth}
                renderChartData={renderChartData}
                activePreview={activePreview}
                setActivePreview={setActivePreview}
                t={t}
                lang={lang}
              />

              {/* Verse Preview Drawer Below Chart */}
              {activePreview && activePreview.verses && activePreview.verses.length > 0 && (
                <section className="preview-container">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px'
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#1e3a8a' }}>
                      {t('matchesFor')} <bdi>{activePreview.name}</bdi>{' '}
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                        {activePreview.verses.length >= 100 ? t('first100') : `(${activePreview.verses.length})`}
                      </span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActivePreview(null)}
                      aria-label="Close preview"
                      style={{
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#475569',
                        borderRadius: '6px',
                        width: '28px',
                        height: '28px',
                        cursor: 'pointer',
                        fontWeight: '700'
                      }}
                    >
                      ×
                    </button>
                  </div>

                  {activePreview.verses.map((vObj, idx) => (
                    <div key={idx} className="verse-item">
                      <div className="verse-ref">{vObj.ref}</div>
                      <div className="verse-text">{renderHighlightedVerseWords(vObj)}</div>
                    </div>
                  ))}
                </section>
              )}
            </>
          )}
        </main>

        {/* Control Sidebar */}
        <ControlSidebar
          mobileView={mobileView}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          searchMode={searchMode}
          setSearchMode={setSearchMode}
          acronymPosition={acronymPosition}
          setAcronymPosition={setAcronymPosition}
          ranges={ranges}
          loading={loading}
          isScopeOpen={isScopeOpen}
          onOpenScope={() => setIsScopeOpen(true)}
          onCloseScope={() => setIsScopeOpen(false)}
          handleSearch={handleSearch}
          t={t}
          lang={lang}
          elsSubMode={elsSubMode}
          setElsSubMode={setElsSubMode}
          manualConfig={manualConfig}
          setManualConfig={setManualConfig}
          includeSpaces={includeSpaces}
          setIncludeSpaces={setIncludeSpaces}
          anchorConfig={anchorConfig}
          setAnchorConfig={setAnchorConfig}
        />

        {/* Comparison Scopes Overlay */}
        {isScopeOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.45)',
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={() => setIsScopeOpen(false)}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                width: '100%',
                maxWidth: '540px',
                maxHeight: '85dvh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(15, 23, 42, 0.25)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Scope Modal Header */}
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <h3 style={{ margin: 0, fontSize: '16px', color: '#1e3a8a' }}>
                  {t('comparisonScopes')}
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleSelectAllBooks}
                    style={{
                      padding: '6px 10px',
                      fontSize: '12px',
                      fontWeight: '600',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#f8fafc',
                      color: '#1d4ed8',
                      cursor: 'pointer'
                    }}
                  >
                    {t('selectAllBooks')}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllBooks}
                    style={{
                      padding: '6px 10px',
                      fontSize: '12px',
                      fontWeight: '600',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#f8fafc',
                      color: '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    {t('clearAll')}
                  </button>
                </div>
              </div>

              {/* Scrollable Book & Chapter List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
                {booksList.map((book) => {
                  const rangeObj = ranges.find((r) => r.bookId === book.id);
                  const selCount = rangeObj ? rangeObj.selectedChapters.length : 0;
                  const isExpanded = expandedBookId === book.id;

                  return (
                    <div
                      key={book.id}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        marginBottom: '8px',
                        padding: '10px 12px',
                        backgroundColor: selCount > 0 ? '#ffffff' : '#f8fafc'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}>
                          <input
                            type="checkbox"
                            checked={selCount === book.maxCh}
                            ref={(el) => {
                              if (el) el.indeterminate = selCount > 0 && selCount < book.maxCh;
                            }}
                            onChange={() => toggleBookAllChapters(book)}
                            style={{ accentColor: '#1d4ed8', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>
                            {getBookLabel(book)}
                          </span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            ({selCount}/{book.maxCh})
                          </span>
                        </label>

                        <button
                          type="button"
                          onClick={() => setExpandedBookId(isExpanded ? null : book.id)}
                          style={{
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#f8fafc',
                            color: '#1d4ed8',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          {t('chapters')} {isExpanded ? '▲' : '▼'}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="chapter-grid">
                          {Array.from({ length: book.maxCh }, (_, i) => i + 1).map((ch) => {
                            const selected = rangeObj?.selectedChapters.includes(ch);
                            return (
                              <button
                                key={ch}
                                type="button"
                                className={`chapter-btn ${selected ? 'selected' : ''}`}
                                onClick={() => toggleSingleChapter(book.id, ch)}
                              >
                                {ch}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Scope Modal Footer */}
              <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                <button
                  type="button"
                  onClick={() => setIsScopeOpen(false)}
                  className="btn btn-run"
                >
                  {t('done')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* About / Info Modal */}
        {isInfoOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.45)',
              zIndex: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={() => setIsInfoOpen(false)}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                width: '100%',
                maxWidth: '500px',
                maxHeight: '85dvh',
                overflowY: 'auto',
                padding: '22px',
                boxShadow: '0 20px 40px rgba(15, 23, 42, 0.25)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', color: '#1e3a8a' }}>{t('infoTitle')}</h2>
                <button
                  type="button"
                  onClick={() => setIsInfoOpen(false)}
                  style={{
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#f8fafc',
                    color: '#475569',
                    borderRadius: '6px',
                    width: '30px',
                    height: '30px',
                    cursor: 'pointer',
                    fontWeight: '700'
                  }}
                >
                  ×
                </button>
              </div>
              <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#334155', marginTop: 0 }}>
                {t('infoIntro')}
              </p>
              <h4 style={{ margin: '14px 0 8px 0', fontSize: '13px', color: '#1e3a8a', textTransform: 'uppercase' }}>
                {t('infoModesTitle')}
              </h4>
              <ul style={{ margin: 0, paddingInlineStart: '18px', fontSize: '13px', lineHeight: '1.65', color: '#334155' }}>
                <li><strong>{t('exact')}:</strong> {t('infoExactDesc')}</li>
                <li><strong>{t('root')}:</strong> {t('infoRootDesc')}</li>
                <li><strong>{t('letter')}:</strong> {t('infoLetterDesc')}</li>
                <li><strong>{t('acronym')}:</strong> {t('infoAcronymDesc')}</li>
                <li><strong>{t('gematria')}:</strong> {t('infoGematriaDesc')}</li>
                <li><strong>{t('els')}:</strong> {t('infoElsDesc')}</li>
              </ul>
              <p style={{ marginTop: '14px', marginBottom: 0, fontSize: '12px', color: '#64748b', backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '8px' }}>
                {t('infoTip')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Two-Tap Android Exit Toast */}
      {ExitToast}
    </div>
  );
}

export default App;