import { useState } from 'react';
import { SongRow } from '../../components/SongRow/SongRow';
import { SearchIcon } from '../../components/icons/SearchIcon';
import type { Song } from '../../types/song';
import { MOCK_LIBRARY } from './mockData'; // MOCK — quitar
import styles from './Landing.module.css';

const PAGE_SIZE = 6;

interface SearchPanelProps {
  onSearch?: (query: string) => void;
  onAddSong?: (song: Song) => void;
}

export function SearchPanel({ onSearch, onAddSong }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const handleSearch = () => {
    setSubmittedQuery(query);
    setPage(1);
    if (onSearch) {
      onSearch(query);
    } else {
      console.log('onSearch not implemented', query);
    }
  };

  const handleAdd = (song: Song) => {
    setAddedIds((prev) => new Set(prev).add(song.id));
    if (onAddSong) {
      onAddSong(song);
    } else {
      console.log('onAddSong not implemented', song);
    }
  };

  // MOCK — quitar: filtro client-side sobre biblioteca de ejemplo.
  const results = submittedQuery
    ? MOCK_LIBRARY.filter(
        (song) =>
          song.title.toLowerCase().includes(submittedQuery.toLowerCase()) ||
          song.artist.toLowerCase().includes(submittedQuery.toLowerCase()),
      )
    : [];

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const pageResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className={styles.tabContent}>
      <div className={styles.searchRow}>
        <input
          className="t-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Song title, artist, or album…"
        />
        <button className={styles.searchBtn} onClick={handleSearch}>
          Search
        </button>
      </div>

      {submittedQuery === '' && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconSquare}>
            <SearchIcon size={22} color="rgba(252,60,68,0.6)" />
          </div>
          <p className={styles.emptyTitle}>Search Spotify</p>
          <p className={styles.emptyHint}>
            Type a song name, artist,
            <br />
            or album to find matches
          </p>
        </div>
      )}

      {submittedQuery !== '' && results.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No songs found</p>
          <p className={styles.emptyHint}>Try a different search term</p>
        </div>
      )}

      {results.length > 0 && (
        <>
          <span className={styles.resultsCount}>
            {results.length} results · page {page} of {totalPages}
          </span>
          <div className={styles.resultsList}>
            {pageResults.map((song) => (
              <SongRow
                key={song.id}
                song={song}
                action={
                  <button
                    className={styles.addBtn}
                    disabled={addedIds.has(song.id)}
                    onClick={() => handleAdd(song)}
                  >
                    {addedIds.has(song.id) ? '✓ Added' : '+ Add'}
                  </button>
                }
              />
            ))}
          </div>
          <div className={styles.pagination}>
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              ← Prev
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
