import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchClient, userClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface Media {
  id: number;
  title: { romaji: string; english: string | null };
  genres: string[];
  coverImage: { large: string };
  averageScore: number | null;
  status: string;
  episodes: number | null;
  chapters: number | null;
  format: string;
}

type SearchType = 'anime' | 'manga';

export default function SearchPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('manga');
  const [results, setResults] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setFeedback('');
    try {
      const res = await searchClient.get(`/search/${searchType}`, { params: { q: query } });
      setResults(res.data.Page?.media || []);
    } catch {
      setFeedback('Search failed. Is the search-service running?');
    } finally {
      setLoading(false);
    }
  }

  async function addToList(media: Media) {
    try {
      await userClient.post('/lists', {
        animeId: media.id,
        title: media.title.english || media.title.romaji,
        coverImage: media.coverImage.large,
        status: searchType === 'manga' ? 'plan_to_read' : 'plan_to_watch',
      });
      setFeedback(`"${media.title.english || media.title.romaji}" added to your list.`);
      setTimeout(() => setFeedback(''), 3000);
    } catch {
      setFeedback('Failed to add. Are you logged in?');
    }
  }

  return (
    <div className="page">
      <header>
        <h1>Tanuki</h1>
        <div className="user-info">
          <span>{user?.username}</span>
          <a href="/top-seinen" style={{ color: '#e85d04', marginRight: '1rem' }}>Top Seinen</a>
          <a href="/list" style={{ color: '#e85d04', marginRight: '1rem' }}>My List</a>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <form onSubmit={handleSearch} className="search-form">
        <div className="type-toggle">
          <button
            type="button"
            className={searchType === 'manga' ? 'active' : ''}
            onClick={() => { setSearchType('manga'); setResults([]); }}
          >
            Manga
          </button>
          <button
            type="button"
            className={searchType === 'anime' ? 'active' : ''}
            onClick={() => { setSearchType('anime'); setResults([]); }}
          >
            Anime
          </button>
        </div>
        <input
          type="text"
          placeholder={`Search ${searchType}...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {feedback && <p className="feedback">{feedback}</p>}

      <div className="results">
        {results.map((media) => (
          <div key={media.id} className="card" onClick={() => navigate(`/media/${media.id}?type=${searchType.toUpperCase()}`)} style={{ cursor: "pointer" }}>
            <img src={media.coverImage.large} alt={media.title.romaji} />
            <div className="card-info">
              <h3>{media.title.english || media.title.romaji}</h3>
              <p>{media.genres.join(', ')}</p>
              <p>
                Score: {media.averageScore ?? 'N/A'} |{' '}
                {searchType === 'manga'
                  ? `Chapters: ${media.chapters ?? '?'}`
                  : `Episodes: ${media.episodes ?? '?'}`}
              </p>
              <p>Status: {media.status} · {media.format}</p>
              <button onClick={() => addToList(media)}>+ Add to list</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
