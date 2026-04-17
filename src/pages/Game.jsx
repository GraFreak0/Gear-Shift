import React, { useEffect, useRef, useState } from 'react';
import { initGame } from '../game/main';

export default function Game() {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const [portraitDismissed, setPortraitDismissed] = useState(false);

  useEffect(() => {
    if (containerRef.current && !gameRef.current) {
      gameRef.current = initGame('game-container');
    }
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        width: '100dvw',
        height: '100dvh',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <div
        id="game-container"
        ref={containerRef}
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
      />

      {/* Rotate hint — shown on portrait mobile unless dismissed */}
      {!portraitDismissed && (
        <div
          className="rotate-hint"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffcc44',
            fontFamily: 'monospace',
            fontSize: '22px',
            textAlign: 'center',
            padding: '20px',
            zIndex: 999,
          }}
        >
          <div style={{ fontSize: 48 }}>📱↻</div>
          <div style={{ marginTop: 16 }}>Rotate your device</div>
          <div style={{ fontSize: 14, color: '#aaaacc', marginTop: 8 }}>
            GEARWORKS plays best in landscape mode
          </div>
          <button
            onClick={() => setPortraitDismissed(true)}
            style={{
              marginTop: 28,
              padding: '10px 24px',
              background: 'transparent',
              border: '2px solid #445566',
              borderRadius: 6,
              color: '#778899',
              fontFamily: 'monospace',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Play in portrait anyway
          </button>
        </div>
      )}

      <style>{`
        .rotate-hint {
          display: none !important;
        }
        @media (max-width: 600px) and (orientation: portrait) {
          .rotate-hint {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}