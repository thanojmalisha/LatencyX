import { useState, useEffect } from 'react';
import { Server, Globe, Search, Cable, CheckCircle2 } from 'lucide-react';
import { GAMES_DATABASE } from '../data/gamesDatabase';
import { GameIcon } from './GameIcons';

export default function GameServerSelector({ onSelect, disabled }) {
  const [selectedGame, setSelectedGame] = useState(GAMES_DATABASE[0]); // default to Valorant
  const [selectedServer, setSelectedServer] = useState(GAMES_DATABASE[0].servers[0]); // default to Mumbai
  const [search, setSearch] = useState('');

  // Notify parent on initial load or changes
  useEffect(() => {
    if (selectedGame && selectedServer) {
      onSelect({ game: selectedGame, server: selectedServer });
    }
  }, [selectedGame, selectedServer, onSelect]);

  const filteredGames = GAMES_DATABASE.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.publisher.toLowerCase().includes(search.toLowerCase())
  );

  function handleGameClick(game) {
    setSelectedGame(game);
    // select first server of new game by default
    const firstServer = game.servers[0];
    setSelectedServer(firstServer);
    onSelect({ game, server: firstServer });
  }

  function handleServerClick(server) {
    setSelectedServer(server);
    onSelect({ game: selectedGame, server });
  }

  return (
    <div className="selector-container">
      {/* Search Bar for Quick Filtering */}
      <div className="game-search-bar">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search game (e.g. Valorant, CS2, Dota 2, Apex)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        {search && (
          <button className="clear-search-btn" onClick={() => setSearch('')}>Clear</button>
        )}
      </div>

      {/* Visual Game Cards Grid */}
      <div className="games-grid">
        {filteredGames.map(game => {
          const isSelected = selectedGame?.id === game.id;
          return (
            <button
              key={game.id}
              type="button"
              className={`game-card ${isSelected ? 'game-card-active' : ''}`}
              onClick={() => handleGameClick(game)}
            >
              <div className="game-card-icon-wrap">
                <GameIcon gameId={game.id} size={32} />
              </div>
              <div className="game-card-info">
                <span className="game-card-name">{game.name}</span>
                <span className="game-card-sub">{game.servers.length} Regional Servers</span>
              </div>
              {isSelected && (
                <div className="game-selected-indicator">
                  <CheckCircle2 size={16} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Server Region Selector Chips for Selected Game */}
      {selectedGame && (
        <div className="server-selection-box">
          <div className="server-box-header">
            <div className="server-box-title">
              <GameIcon gameId={selectedGame.id} size={20} />
              <span>Select Server Region for {selectedGame.name}</span>
            </div>
            <span className="server-badge-provider">
              Host: {selectedServer?.provider || 'Cloud Datacenter'}
            </span>
          </div>

          <div className="server-chips-grid">
            {selectedGame.servers.map(server => {
              const isServerActive = selectedServer?.id === server.id;
              return (
                <button
                  key={server.id}
                  type="button"
                  className={`server-chip ${isServerActive ? 'server-chip-active' : ''}`}
                  onClick={() => handleServerClick(server)}
                >
                  <div className="server-chip-top">
                    <Server size={14} />
                    <span className="server-chip-region">{server.region}</span>
                  </div>

                  <div className="server-chip-bottom">
                    <span className="server-chip-cable">
                      <Cable size={12} />
                      {server.cableRoute.split('→')[0].trim()}
                    </span>
                    <span className="server-chip-est">
                      {server.expectedPing.sltFiber}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Server Routing Summary */}
          {selectedServer && (
            <div className="server-routing-summary">
              <div className="route-detail">
                <span className="route-label">Subsea Cable Routing</span>
                <span className="route-value">{selectedServer.cableRoute}</span>
              </div>
              <div className="route-detail">
                <span className="route-label">Target Cloud Host</span>
                <span className="route-value font-mono">{selectedServer.endpoint}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
