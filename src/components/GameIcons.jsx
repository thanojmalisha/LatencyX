import React, { useState } from 'react';

const ICON_MAP = {
  valorant: '/game-icons/valorant.png',
  cs2: '/game-icons/cs2.png',
  csgo: '/game-icons/cs2.png',
  dota2: '/game-icons/dota2.png',
  pubg: '/game-icons/pubg.png',
  pubgm: '/game-icons/pubg.png',
  fortnite: '/game-icons/fortnite.png',
  apex: '/game-icons/apex.jpg',
  'cod-warzone': '/game-icons/cod-warzone.png',
  cod: '/game-icons/cod-warzone.png',
  lol: '/game-icons/lol.jpg',
  'rocket-league': '/game-icons/rocket-league.jpg',
  'ea-fc24': '/game-icons/ea-fc24.jpg',
  'gta-online': '/game-icons/gta-online.jpg',
  freefire: '/game-icons/freefire.png',
  'free-fire': '/game-icons/freefire.png',
};

export function GameIcon({ gameId, size = 36, className = "" }) {
  const [hasError, setHasError] = useState(false);
  const iconSrc = ICON_MAP[gameId];

  if (!iconSrc || hasError) {
    return (
      <div
        className={`game-icon-fallback ${className}`}
        style={{ width: size, height: size }}
      >
        <span>🎮</span>
      </div>
    );
  }

  return (
    <div
      className={`game-icon-image-wrapper ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src={iconSrc}
        alt={`${gameId} icon`}
        className="game-icon-img"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          borderRadius: 8,
        }}
        onError={() => setHasError(true)}
      />
    </div>
  );
}
