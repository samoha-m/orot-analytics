import { booksList } from './constants';

export const FLASHCARD_SWAP_MS = 6000;

export function getDiscoveryFlashcards(lang = 'he') {
  const torahIds = ['01', '02', '03', '04', '05'];
  const findBookId = (heName, enSub) => {
    const found = booksList.find(
      (b) => b.he === heName || b.name.toLowerCase().includes(enSub)
    );
    return found ? found.id : '01';
  };

  const songId = findBookId('שיר השירים', 'song');
  const estherId = findBookId('אסתר', 'esther');
  const psalmsId = findBookId('תהילים', 'psalm');
  const proverbsId = findBookId('משלי', 'proverb');

  const modeTag = {
    gematria: lang === 'he' ? 'גימטריה' : lang === 'fa' ? 'گماتریا' : 'Gematria',
    els: lang === 'he' ? 'דילוגי אותיות' : lang === 'fa' ? 'پرش حروف' : 'Skip (ELS)',
    acronymFirst:
      lang === 'he' ? 'ראשי תיבות' : lang === 'fa' ? 'سرواژه' : 'Acronym • First',
    acronymLast:
      lang === 'he' ? 'סופי תיבות' : lang === 'fa' ? 'پایان‌واژه' : 'Acronym • Last',
    exact: lang === 'he' ? 'חיפוש טקסט' : lang === 'fa' ? 'جستجوی متن' : 'Text Search',
    letter: lang === 'he' ? 'ספירת אותיות' : lang === 'fa' ? 'شمارش حروف' : 'Letter Count'
  };

  return [
    {
      id: 'gem-13',
      tag: modeTag.gematria,
      searchMode: 'gematria',
      searchTerm: '13',
      bookIds: torahIds,
      text:
        lang === 'he'
          ? 'הידעת שלמילים "אהבה" ו-"אחד" יש בדיוק אותה גימטריה — 13?'
          : lang === 'fa'
          ? 'آیا می‌دانستید دو واژه «אהבה» (عشق) و «אחד» (یکتا) هر دو دارای ارزش گماتریایی ۱۳ هستند؟'
          : 'Did you know that אהבה (Love) and אחד (One) share the exact same Gematria value of 13?'
    },
    {
      id: 'els-torah-gen',
      tag: modeTag.els,
      searchMode: 'els',
      elsSubMode: 'auto',
      searchTerm: 'תורה',
      bookIds: ['01'],
      text:
        lang === 'he'
          ? 'הידעת שהחל מהאות ת׳ הראשונה בבראשית, דילוג של כל אות 50 יוצר את המילה "תורה"?'
          : lang === 'fa'
          ? 'آیا می‌دانستید با شروع از نخستین حرف ת در پیدایش، شمارش هر ۵۰ حرف واژه «תורה» را می‌سازد؟'
          : 'Did you know that starting from the first ת in Genesis 1:1, every 50th letter spells תורה?'
    },
    {
      id: 'acr-elul',
      tag: modeTag.acronymFirst,
      searchMode: 'acronym',
      acronymPosition: 'first',
      searchTerm: 'אלול',
      bookIds: [songId],
      text:
        lang === 'he'
          ? 'הידעת שראשי התיבות של "אני לדודי ודודי לי" בשיר השירים מרכיבים את חודש "אלול"?'
          : lang === 'fa'
          ? 'آیا می‌دانستید حروف آغازین «אני לדודי ודודי לי» در غزل غزل‌ها نام ماه «אלול» را می‌سازد؟'
          : 'Did you know the initial letters of "אני לדודי ודודי לי" in Song of Songs spell אלול?'
    },
    {
      id: 'txt-light-dark',
      tag: modeTag.exact,
      searchMode: 'exact',
      searchTerm: 'אור, חושך',
      bookIds: torahIds,
      text:
        lang === 'he'
          ? 'הידעת שאפשר להשוות בגרף אחד את תפוצת המילים "אור" מול "חושך" בחמישה חומשי תורה?'
          : lang === 'fa'
          ? 'آیا می‌دانستید می‌توانید فراوانی «אור» (نور) و «חושך» (تاریکی) را هم‌زمان در تورات مقایسه کنید؟'
          : 'Did you know you can compare "אור" (Light) vs. "חושך" (Darkness) side-by-side across the Torah?'
    },
    {
      id: 'gem-86',
      tag: modeTag.gematria,
      searchMode: 'gematria',
      searchTerm: '86',
      bookIds: torahIds,
      text:
        lang === 'he'
          ? 'הידעת שלשם "אלהים" ולמילה "הטבע" יש אותו ערך גימטרי — 86?'
          : lang === 'fa'
          ? 'آیا می‌دانستید واژه «אלהים» و «הטבע» (طبیعت) هر دو ارزش عددی ۸۶ دارند؟'
          : 'Did you know that אלהים (God) and הטבע (Nature) both equal 86 in Gematria?'
    },
    {
      id: 'acr-emet',
      tag: modeTag.acronymLast,
      searchMode: 'acronym',
      acronymPosition: 'last',
      searchTerm: 'אמת',
      bookIds: ['01'],
      text:
        lang === 'he'
          ? 'הידעת שסופי התיבות של "ברא אלהים לעשות" בסיום בריאת העולם יוצרים את המילה "אמת"?'
          : lang === 'fa'
          ? 'آیا می‌دانستید حروف پایانی «ברא אלהים לעשות» در پیدایش ۲:۳ واژه «אמת» (حقیقت) را می‌سازد؟'
          : 'Did you know the final letters of "ברא אלהים לעשות" (Genesis 2:3) spell אמת (Truth)?'
    },
    {
      id: 'els-torah-ex',
      tag: modeTag.els,
      searchMode: 'els',
      elsSubMode: 'auto',
      searchTerm: 'תורה',
      bookIds: ['02'],
      text:
        lang === 'he'
          ? 'הידעת שגם בתחילת ספר שמות מופיעה המילה "תורה" בדילוג מדויק של 50 אותיות?'
          : lang === 'fa'
          ? 'آیا می‌دانستید در آغاز کتاب خروج نیز واژه «תורה» با پرش دقیق ۵۰ حرفی پنهان شده است؟'
          : 'Did you know that תורה also appears at an exact 50-letter skip at the opening of Exodus?'
    },
    {
      id: 'gem-358',
      tag: modeTag.gematria,
      searchMode: 'gematria',
      searchTerm: '358',
      bookIds: torahIds,
      text:
        lang === 'he'
          ? 'הידעת שלמילים "משיח" ו-"נחש" יש אותה גימטריה בדיוק — 358?'
          : lang === 'fa'
          ? 'آیا می‌دانستید «משיח» (مسیح) و «נחש» (مار) هر دو دارای ارزش گماتریایی ۳۵۸ هستند؟'
          : 'Did you know that משיח (Messiah) and נחש (Serpent) both share the Gematria value of 358?'
    },
    {
      id: 'ltr-aleph-tav',
      tag: modeTag.letter,
      searchMode: 'letter',
      searchTerm: 'א, ת',
      bookIds: torahIds,
      text:
        lang === 'he'
          ? 'הידעת שאפשר למדוד את שכיחות האותיות "א" מול "ת" בכל אחד מחומשי התורה?'
          : lang === 'fa'
          ? 'آیا می‌دانستید می‌توانید بسامد حرف «א» را در برابر «ת» در تمام کتاب‌های تورات بسنجید؟'
          : 'Did you know you can measure how often א (Aleph) appears vs. ת (Tav) across the Torah?'
    },
    {
      id: 'acr-esther',
      tag: modeTag.acronymFirst,
      searchMode: 'acronym',
      acronymPosition: 'first',
      searchTerm: 'יהוה',
      bookIds: [estherId],
      text:
        lang === 'he'
          ? 'הידעת שבמגילת אסתר, ראשי התיבות של "יבוא המלך והמן היום" מצפינים את שם ההוויה?'
          : lang === 'fa'
          ? 'آیا می‌دانستید در کتاب استر، سرواژه «יבוא המלך והמן היום» نام مقدس چهارحرفی را می‌سازد؟'
          : 'Did you know the initial letters of "יבוא המלך והמן היום" in Esther encode the Divine Name?'
    },
    {
      id: 'txt-water-earth',
      tag: modeTag.exact,
      searchMode: 'exact',
      searchTerm: 'מים, ארץ',
      bookIds: torahIds,
      text:
        lang === 'he'
          ? 'הידעת כמה פעמים מופיעה המילה "מים" לעומת "ארץ" לאורך התורה?'
          : lang === 'fa'
          ? 'آیا می‌دانستید واژه «מים» (آب) چند بار در مقایسه با «ארץ» (زمین) در تورات آمده است؟'
          : 'Did you know how often "מים" (Water) appears compared to "ארץ" (Earth) across the Torah?'
    },
    {
      id: 'gem-70',
      tag: modeTag.gematria,
      searchMode: 'gematria',
      searchTerm: '70',
      bookIds: ['01', psalmsId, proverbsId],
      text:
        lang === 'he'
          ? 'הידעת שלמילים "יין" ו-"סוד" יש את אותו ערך גימטרי — 70?'
          : lang === 'fa'
          ? 'آیا می‌دانستید دو واژه «יין» (شراب) و «סוד» (راز) هر دو برابر با ۷۰ در گماتریا هستند؟'
          : 'Did you know that יין (Wine) and סוד (Secret) both equal 70 in Gematria?'
    },
    {
      id: 'acr-exodus-last',
      tag: modeTag.acronymLast,
      searchMode: 'acronym',
      acronymPosition: 'last',
      searchTerm: 'יהוה',
      bookIds: ['02'],
      text:
        lang === 'he'
          ? 'הידעת שסופי התיבות של "לי מה שמו מה" בשמות ג׳:י״ג יוצרים את שם ההוויה?'
          : lang === 'fa'
          ? 'آیا می‌دانستید حروف پایانی «לי מה שמו מה» در خروج ۳:۱۳ نام چهارحرفی را پدید می‌آورد؟'
          : 'Did you know the final letters of "לי מה שמו מה" (Exodus 3:13) spell out the Divine Name?'
    },
    {
      id: 'els-moshe',
      tag: modeTag.els,
      searchMode: 'els',
      elsSubMode: 'auto',
      searchTerm: 'משה',
      bookIds: ['01'],
      text:
        lang === 'he'
          ? 'הידעת שאפשר לאתר דילוגי אותיות של השם "משה" השזורים בתוך ספר בראשית?'
          : lang === 'fa'
          ? 'آیا می‌دانستید می‌توانید پرش‌های حروف نام «משה» (موسی) را در کتاب پیدایش کشف کنید؟'
          : 'Did you know you can uncover skip sequences of the name משה (Moses) woven inside Genesis?'
    },
    {
      id: 'txt-shalom',
      tag: modeTag.exact,
      searchMode: 'exact',
      searchTerm: 'שלום',
      bookIds: torahIds,
      text:
        lang === 'he'
          ? 'הידעת היכן בתורה מרוכזת המילה "שלום" ובאילו פסוקים היא מופיעה?'
          : lang === 'fa'
          ? 'آیا می‌دانستید واژه «שלום» (صلح) در کدام بخش‌های تورات بیشترین تمرکز را دارد؟'
          : 'Did you know where the word שלום (Peace) is concentrated across the Five Books of Moses?'
    }
  ];
}