import React from 'react';

function InfoModal({ isOpen, onClose, t, lang }) {
  if (!isOpen) return null;

  const isRTL = lang === 'he' || lang === 'fa';

  const modes = [
    { title: t('exact'), desc: t('infoExactDesc'), badgeColor: '#1d4ed8', badgeBg: '#eff6ff' },
    { title: t('root'), desc: t('infoRootDesc'), badgeColor: '#1d4ed8', badgeBg: '#eff6ff' },
    { title: t('letter'), desc: t('infoLetterDesc'), badgeColor: '#1d4ed8', badgeBg: '#eff6ff' },
    { title: t('acronym'), desc: t('infoAcronymDesc'), badgeColor: '#b45309', badgeBg: '#fef3c7' },
    { title: t('gematria'), desc: t('infoGematriaDesc'), badgeColor: '#b45309', badgeBg: '#fef3c7' },
    { title: t('els'), desc: t('infoElsDesc'), badgeColor: '#1e3a8a', badgeBg: '#e0e7ff' }
  ];

  return (
    <div
      onClick={onClose}
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
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
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 24px 48px rgba(15, 23, 42, 0.2)',
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
            borderBottom: '1px solid #e2e8f0'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1d4ed8',
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
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e3a8a' }}>
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
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              color: '#475569',
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
        <p style={{ margin: '0 0 16px 0', fontSize: '14px', lineHeight: '1.6', color: '#334155' }}>
          {t('infoIntro')}
        </p>

        {/* Search Modes */}
        <div
          style={{
            fontSize: '11px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#64748b',
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
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0'
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
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  marginTop: '1px'
                }}
              >
                {m.title}
              </span>
              <span style={{ fontSize: '13px', lineHeight: '1.5', color: '#334155' }}>
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
            backgroundColor: '#fef3c7',
            border: '1px solid #fde68a',
            color: '#92400e',
            fontSize: '13px',
            lineHeight: '1.5',
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