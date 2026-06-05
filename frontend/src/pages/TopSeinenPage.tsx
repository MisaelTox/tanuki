import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchClient, userClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface Manga {
  id: number;
  title: { romaji: string; english: string | null };
  genres: string[];
  coverImage: { large: string };
  averageScore: number | null;
  status: string;
  chapters: number | null;
  volumes: number | null;
  popularity: number;
}

export default function TopSeinenPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    searchClient.get('/search/top-seinen', { params: { perPage: 10 } })
      .then((res) => setMangas(res.data.Page?.media || []))
      .catch(() => setFeedback('Error loading top seinen.'))
      .finally(() => setLoading(false));
  }, []);

  async function addToList(manga: Manga) {
    try {
      await userClient.post('/lists', {
        animeId: manga.id,
        title: manga.title.english || manga.title.romaji,
        coverImage: manga.coverImage.large,
        status: 'plan_to_read',
      });
      setFeedback(`"${manga.title.english || manga.title.romaji}" added to your list.`);
      setTimeout(() => setFeedback(''), 3000);
    } catch {
      setFeedback('Failed to add.');
    }
  }

  return (
    <div className="page">
      <header>
        <h1>Tanuki</h1>
        <div className="user-info">
          <span>{user?.username}</span>
          <a href="/search" style={{ color: '#e85d04', marginRight: '1rem' }}>Search</a>
          <a href="/list" style={{ color: '#e85d04', marginRight: '1rem' }}>My List</a>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <h2 style={{ marginBottom: '1.5rem', color: '#fff' }}>
        🏆 Top 10 Manga Seinen
      </h2>

      {feedback && <p className="feedback">{feedback}</p>}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="top-list">
          {mangas.map((manga, index) => (
            <div
              key={manga.id}
              className="top-item"
              onClick={() => navigate(`/media/${manga.id}?type=MANGA`)}
            >
              <span className="top-rank">#{index + 1}</span>
              <img src={manga.coverImage.large} alt={manga.title.romaji} />
              <div className="top-info">
                <h3>{manga.title.english || manga.title.romaji}</h3>
                <div className="detail-meta" style={{ marginBottom: '0.5rem' }}>
                  {manga.averageScore && <span>⭐ {manga.averageScore}/100</span>}
                  {manga.volumes && <span>{manga.volumes} vols</span>}
                  {manga.chapters && <span>{manga.chapters} caps</span>}
                  <span>{manga.status}</span>
                  <span>👥 {manga.popularity.toLocaleString()}</span>
                </div>
                <p className="top-genres">{manga.genres.slice(0, 4).join(' · ')}</p>
              </div>
              <button
                className="add-btn"
                style={{ marginLeft: 'auto', minWidth: '120px' }}
                onClick={(e) => { e.stopPropagation(); addToList(manga); }}
              >
                + Mi lista
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
