import React from 'react';

function InfoModal({ isOpen, onClose, t, lang }) {
  if (!isOpen) return null;

  const isRTL = lang === 'he' || lang === 'fa';

  const modes = [
    { title: t('exact'), desc: t('infoExactDesc'), badgeColor: '#7dd3fc', badgeBg: 'rgba(56, 189, 248, 0.14)', border: 'rgba(56, 189, 248, 0.35)' },
    { title: t('root'), desc: t('infoRootDesc'), badgeColor: '#7dd3fc', badgeBg: 'rgba(56, 189, 248, 0.14)', border: 'rgba(56, 189, 248, 0.35)' },
    { title: t('letter'), desc: t('infoLetterDesc'), badgeColor: '#6ee7b7', badgeBg: 'rgba(52, 211, 153, 0.14)', border: 'rgba(52, 211, 153, 0.35)' },
    { title: t('acronym'), desc: t('infoAcronymDesc'), badgeColor: '#fde68a', badgeBg: 'rgba(251, 191, 36, 0.14)', border: 'rgba(251, 191, 36, 0.35)' },
    { title: t('gematria'), desc: t('infoGematriaDesc'), badgeColor: '#fde68a', badgeBg: 'rgba(251, 191, 36, 0.14)', border: 'rgba(251, 191, 36, 0.35)' },
    { title: t('els'), desc: t('infoElsDesc'), badgeColor: '#c4b5fd', badgeBg: 'rgba(167, 139, 250, 0.14)', border: 'rgba(167, 139, 250, 0.35)' }
  ];

  return (
    <div
      onClick={onClose}
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        backgroundColor: 'rgba(4, 7, 15, 0.72)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '540px',
          maxHeight: '86vh',
          overflowY: 'auto',
          backgroundColor: '#0d1424',
          borderRadius: '16px',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75)',
          padding: '22px 24px'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '14px',
            marginBottom: '14px',
            borderBottom: '1px solid rgba(30, 41, 59, 0.95)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(56, 189, 248, 0.14)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#f1f5f9' }}>
              {t('infoTitle')}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid rgba(51, 65, 85, 0.85)',
              backgroundColor: '#0f172a',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Intro */}
        <p style={{ margin: '0 0 16px 0', fontSize: '14px', lineHeight: '1.65', color: '#cbd5e1' }}>
          {t('infoIntro')}
        </p>

        {/* Search Modes */}
        <div
          style={{
            fontSize: '11px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#94a3b8',
            marginBottom: '10px'
          }}
        >
          {t('infoModesTitle')}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {modes.map((m) => (
            <div
              key={m.title}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '10px',
                backgroundColor: '#090e1a',
                border: '1px solid rgba(30, 41, 59, 0.95)'
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: m.badgeBg,
                  color: m.badgeColor,
                  border: `1px solid ${m.border}`,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  marginTop: '1px'
                }}
              >
                {m.title}
              </span>
              <span style={{ fontSize: '13px', lineHeight: '1.55', color: '#cbd5e1' }}>
                {m.desc}
              </span>
            </div>
          ))}
        </div>

        {/* Tip Banner */}
        <div
          style={{
            padding: '11px 14px',
            borderRadius: '10px',
            backgroundColor: 'rgba(251, 191, 36, 0.12)',
            border: '1px solid rgba(251, 191, 36, 0.35)',
            color: '#fde68a',
            fontSize: '13px',
            lineHeight: '1.55',
            fontWeight: '500'
          }}
        >
          {t('infoTip')}
        </div>
      </div>
    </div>
  );
}

export default InfoModal;