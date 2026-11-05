export const booksList = [
  { id: '01', name: 'Genesis', he: 'בראשית', maxCh: 50 }, { id: '02', name: 'Exodus', he: 'שמות', maxCh: 40 },
  { id: '03', name: 'Leviticus', he: 'ויקרא', maxCh: 27 }, { id: '04', name: 'Numeri', he: 'במדבר', maxCh: 36 },
  { id: '05', name: 'Deuteronomium', he: 'דברים', maxCh: 34 }, { id: '06', name: 'Josua', he: 'יהושע', maxCh: 24 },
  { id: '07', name: 'Judices', he: 'שופטים', maxCh: 21 }, { id: '08', name: 'Samuel_I', he: 'שמואל א', maxCh: 31 },
  { id: '09', name: 'Samuel_II', he: 'שמואל ב', maxCh: 24 }, { id: '10', name: 'Reges_I', he: 'מלכים א', maxCh: 22 },
  { id: '11', name: 'Reges_II', he: 'מלכים ב', maxCh: 25 }, { id: '12', name: 'Jesaia', he: 'ישעיהו', maxCh: 66 },
  { id: '13', name: 'Jeremia', he: 'ירמיהו', maxCh: 52 }, { id: '14', name: 'Ezechiel', he: 'יחזקאל', maxCh: 48 },
  { id: '15', name: 'Hosea', he: 'הושע', maxCh: 14 }, { id: '16', name: 'Joel', he: 'יואל', maxCh: 4 },
  { id: '17', name: 'Amos', he: 'עמוס', maxCh: 9 }, { id: '18', name: 'Obadia', he: 'עובדיה', maxCh: 1 },
  { id: '19', name: 'Jona', he: 'יונה', maxCh: 4 }, { id: '20', name: 'Micha', he: 'מיכה', maxCh: 7 },
  { id: '21', name: 'Nahum', he: 'נחום', maxCh: 3 }, { id: '22', name: 'Habakuk', he: 'חבקוק', maxCh: 3 },
  { id: '23', name: 'Zephania', he: 'צפניה', maxCh: 3 }, { id: '24', name: 'Haggai', he: 'חגי', maxCh: 2 },
  { id: '25', name: 'Sacharia', he: 'זכריה', maxCh: 14 }, { id: '26', name: 'Maleachi', he: 'מלאכי', maxCh: 3 },
  { id: '27', name: 'Psalmi', he: 'תהילים', maxCh: 150 }, { id: '28', name: 'Iob', he: 'איוב', maxCh: 42 },
  { id: '29', name: 'Proverbia', he: 'משלי', maxCh: 31 }, { id: '30', name: 'Ruth', he: 'רות', maxCh: 4 },
  { id: '31', name: 'Canticum', he: 'שיר השירים', maxCh: 8 }, { id: '32', name: 'Ecclesiastes', he: 'קהלת', maxCh: 12 },
  { id: '33', name: 'Threni', he: 'איכה', maxCh: 5 }, { id: '34', name: 'Esther', he: 'אסתר', maxCh: 10 },
  { id: '35', name: 'Daniel', he: 'דניאל', maxCh: 12 }, { id: '36', name: 'Esra', he: 'עזרא', maxCh: 10 },
  { id: '37', name: 'Nehemia', he: 'נחמיה', maxCh: 13 }, { id: '38', name: 'Chronica_I', he: 'דברי הימים א', maxCh: 29 },
  { id: '39', name: 'Chronica_II', he: 'דברי הימים ב', maxCh: 36 }
];

export const gematriaMap = {
  'א':1, 'ב':2, 'ג':3, 'ד':4, 'ה':5, 'ו':6, 'ז':7, 'ח':8, 'ט':9, 'י':10,
  'כ':20, 'ך':20, 'ל':30, 'מ':40, 'ם':40, 'נ':50, 'ן':50, 'ס':60, 'ע':70,
  'פ':80, 'ף':80, 'צ':90, 'ץ':90, 'ק':100, 'ר':200, 'ש':300, 'ת':400
};

export const calculateGematria = (word) => {
  let sum = 0;
  for (let i = 0; i < word.length; i++) {
    sum += gematriaMap[word[i]] || 0;
  }
  return sum;
};

export const numberToHebrew = (num) => {
  if (num === 0) return '';
  let hebrew = '';
  if (num >= 100) { hebrew += 'ק'; num -= 100; }
  if (num === 15) return hebrew + 'טו';
  if (num === 16) return hebrew + 'טז';
  const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
  const units = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
  hebrew += tens[Math.floor(num / 10)] + units[num % 10];
  return hebrew;
};

export const COLORS = ['#0056b3', '#dc3545', '#28a745', '#ffc107', '#6f42c1'];