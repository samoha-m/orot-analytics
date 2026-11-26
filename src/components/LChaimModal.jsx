import React, { useState, useEffect } from 'react';

// Replace with your Buy Me a Coffee, Ko-fi, PayPal, or Stripe link
const SUPPORT_URL = 'https://buymeacoffee.com/your-username';

function LChaimModal({ isOpen, onClose, lang = 'he' }) {
  const isRTL = lang === 'he' || lang === 'fa';
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [visible, setVisible] = useState(false);
  const [selectedTier, setSelectedTier] = useState('kiddush');

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 220);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  const copy =
    lang === 'he'
      ? {
          badge: 'לחיים • תמיכה בפרויקט',
          title: 'הזמן אותי ללחיים',
          subtitle:
            'OROT הוא פרויקט עצמאי שנבנה באהבה לחקר המקרא. אם הכלי עזר לך לגלות תובנה חדשה, אפשר להרים כוסית ולתמוך בהמשך הפיתוח והשרתים.',
          popular: 'הכי פופולרי',
          tiers: [
            {
              id: 'arak',
              icon: '🥃',
              name: 'כוסית ערק',
              desc: 'תודה קטנה על תובנה יפה',
              amount: '$5'
            },
            {
              id: 'kiddush',
              icon: '🍷',
              name: 'גביע קידוש',
              desc: 'תמיכה בתחזוקת השרתים',
              amount: '$10'
            },
            {
              id: 'shabbat',
              icon: '🍾',
              name: 'בקבוק יין לשבת (ח״י)',
              desc: 'תרומה כפולה להמשך הפיתוח',
              amount: '$18'
            }
          ],
          cta: (amount) => `המשך לתרומת ${amount} · לחיים!`,
          footerNote: 'התשלום מתבצע בצורה מאובטחת בעמוד התמיכה החיצוני'
        }
      : lang === 'fa'
      ? {
          badge: 'لحیم • حمایت از پروژه',
          title: 'یک جام لحیم مهمانم کن',
          subtitle:
            'OROT یک پروژه مستقل برای پژوهش محاسباتی تنخ است. اگر این ابزار برایتان مفید بوده، با یک نوشیدنی گرم از توسعه و سرورهای آن حمایت کنید.',
          popular: 'محبوب‌ترین',
          tiers: [
            {
              id: 'arak',
              icon: '🥃',
              name: 'یک پیک عرق',
              desc: 'تشکر کوچک برای یک کشف جالب',
              amount: '$5'
            },
            {
              id: 'kiddush',
              icon: '🍷',
              name: 'جام کیدوش',
              desc: 'کمک به هزینه سرورها',
              amount: '$10'
            },
            {
              id: 'shabbat',
              icon: '🍾',
              name: 'بطری شراب شبات (حای)',
              desc: 'حمایت ویژه از توسعه امکانات جدید',
              amount: '$18'
            }
          ],
          cta: (amount) => `ادامه و پرداخت ${amount} · لحیم!`,
          footerNote: 'پرداخت به‌صورت امن در صفحه حمایت انجام می‌شود'
        }
      : {
          badge: "L'CHAIM • SUPPORT OROT",
          title: "Pour a L'Chaim",
          subtitle:
            'OROT is an independent project built for biblical exploration. If it helped you uncover a meaningful insight, raise a glass to help cover servers and new features.',
          popular: 'Most Popular',
          tiers: [
            {
              id: 'arak',
              icon: '🥃',
              name: 'Shot of Arak',
              desc: 'A quick toast for a neat discovery',
              amount: '$5'
            },
            {
              id: 'kiddush',
              icon: '🍷',
              name: 'Kiddush Cup',
              desc: 'Helps keep the servers running',
              amount: '$10'
            },
            {
              id: 'shabbat',
              icon: '🍾',
              name: 'Shabbat Wine (Chai)',
              desc: 'Double Chai boost for new tools',
              amount: '$18'
            }
          ],
          cta: (amount) => `Continue with ${amount} · L'Chaim!`,
          footerNote: 'Opens securely in your external support page'
        };

  const activeTier = copy.tiers.find((item) => item.id === selectedTier) || copy.tiers[1];

  const handleSupportClick = () => {
    window.open(SUPPORT_URL, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        backgroundColor: visible ? 'rgba(4, 7, 15, 0.78)' : 'rgba(4, 7, 15, 0)',
        backdropFilter: visible ? 'blur(6px)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        transition: 'background-color 0.22s ease, backdrop-filter 0.22s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#0d1424',
          borderRadius: '18px',
          border: '1px solid rgba(251, 191, 36, 0.42)',
          boxShadow:
            '0 24px 60px rgba(0, 0, 0, 0.78), 0 0 32px -6px rgba(251, 191, 36, 0.22)',
          overflow: 'hidden',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(14px) scale(0.98)',
          transition:
            'opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '18px 20px 14px 20px',
            background:
              'linear-gradient(160deg, rgba(251, 191, 36, 0.12) 0%, rgba(15, 23, 42, 0.6) 100%)',
            borderBottom: '1px solid rgba(51, 65, 85, 0.75)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px',
                borderRadius: '999px',
                backgroundColor: 'rgba(251, 191, 36, 0.14)',
                border: '1px solid rgba(251, 191, 36, 0.38)',
                color: '#fde68a',
                fontSize: '11px',
                fontWeight: '700',
                marginBottom: '8px'
              }}
            >
              <span>✦</span>
              <span>{copy.badge}</span>
            </span>
            <h3
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '800',
                color: '#ffffff'
              }}
            >
              {copy.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '999px',
              border: '1px solid rgba(51, 65, 85, 0.85)',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              color: '#94a3b8',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body & Tiers */}
        <div style={{ padding: '16px 20px 20px 20px' }}>
          <p
            style={{
              margin: '0 0 16px 0',
              fontSize: '13.5px',
              lineHeight: '1.65',
              color: '#cbd5e1'
            }}
          >
            {copy.subtitle}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '18px' }}>
            {copy.tiers.map((tier) => {
              const isSelected = tier.id === selectedTier;
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setSelectedTier(tier.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: isSelected
                      ? '1.5px solid #fbbf24'
                      : '1px solid rgba(51, 65, 85, 0.85)',
                    backgroundColor: isSelected
                      ? 'rgba(251, 191, 36, 0.13)'
                      : 'rgba(15, 23, 42, 0.78)',
                    boxShadow: isSelected
                      ? '0 0 18px -4px rgba(251, 191, 36, 0.35)'
                      : 'none',
                    cursor: 'pointer',
                    textAlign: isRTL ? 'right' : 'left',
                    transition: 'all 0.16s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 }}>
                    <span style={{ fontSize: '22px', lineHeight: 1, flexShrink: 0 }}>
                      {tier.icon}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '7px',
                          flexWrap: 'wrap'
                        }}
                      >
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: '700',
                            color: isSelected ? '#fef3c7' : '#f1f5f9'
                          }}
                        >
                          {tier.name}
                        </span>
                        {tier.id === 'kiddush' && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: '700',
                              padding: '1px 7px',
                              borderRadius: '999px',
                              backgroundColor: 'rgba(56, 189, 248, 0.16)',
                              border: '1px solid rgba(56, 189, 248, 0.4)',
                              color: '#7dd3fc'
                            }}
                          >
                            {copy.popular}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                        {tier.desc}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '15px',
                      fontWeight: '800',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      backgroundColor: isSelected
                        ? 'rgba(251, 191, 36, 0.22)'
                        : 'rgba(30, 41, 59, 0.85)',
                      color: isSelected ? '#fde68a' : '#cbd5e1',
                      flexShrink: 0
                    }}
                  >
                    {tier.amount}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleSupportClick}
            style={{
              width: '100%',
              height: '44px',
              borderRadius: '11px',
              border: '1px solid rgba(253, 230, 138, 0.8)',
              background: 'linear-gradient(90deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)',
              color: '#070a12',
              fontSize: '14px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 0 22px -2px rgba(251, 191, 36, 0.45)',
              transition: 'transform 0.12s ease, opacity 0.15s ease'
            }}
          >
            {copy.cta(activeTier.amount)}
          </button>

          <div
            style={{
              marginTop: '10px',
              textAlign: 'center',
              fontSize: '11px',
              color: '#64748b'
            }}
          >
            {copy.footerNote}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LChaimModal;