import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { searchClient, userClient } from '../api/client';

interface MediaDetail {
  id: number;
  title: { romaji: string; english: string | null; native: string | null };
  description: string | null;
  genres: string[];
  tags: { name: string; isMediaSpoiler: boolean }[];
  coverImage: { large: string };
  bannerImage: string | null;
  averageScore: number | null;
  status: string;
  format: string;
  chapters: number | null;
  volumes: number | null;
  episodes: number | null;
  seasonYear: number | null;
  popularity: number;
  favourites: number;
  staff: { nodes: { id: number; name: { full: string }; primaryOccupations: string[] }[] };
  characters: { nodes: { id: number; name: { full: string }; image: { medium: string } }[] };
  startDate: { year: number | null };
}

export default function DetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const type = (searchParams.get('type') || 'MANGA').toUpperCase();
  const navigate = useNavigate();
  const [media, setMedia] = useState<MediaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    searchClient.get(`/search/media/${id}`, { params: { type } })
      .then((res) => setMedia(res.data.Media))
      .catch(() => navigate(-1))
      .finally(() => setLoading(false));
  }, [id]);

  async function addToList() {
    if (!media) return;
    try {
      await userClient.post('/lists', {
        animeId: media.id,
        title: media.title.english || media.title.romaji,
        coverImage: media.coverImage.large,
        status: type === 'MANGA' ? 'plan_to_read' : 'plan_to_watch',
      });
      setFeedback('Added to your list!');
      setTimeout(() => setFeedback(''), 3000);
    } catch {
      setFeedback('Failed to add.');
    }
  }

  function stripHtml(html: string) {
    return html.replace(/<[^>]*>/g, '');
  }

  if (loading || !media) return <div className="loading">Loading...</div>;

  const title = media.title.english || media.title.romaji;
  const visibleTags = media.tags.filter((t) => !t.isMediaSpoiler).slice(0, 8);

  return (
    <div className="detail-page">
      {media.bannerImage && (
        <div className="banner" style={{ backgroundImage: `url(${media.bannerImage})` }} />
      )}

      <div className="detail-content">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

        <div className="detail-main">
          <img src={media.coverImage.large} alt={title} className="detail-cover" />

          <div className="detail-info">
            <h1>{title}</h1>
            {media.title.native && <p className="native-title">{media.title.native}</p>}

            <div className="detail-meta">
              <span>{media.format}</span>
              <span>{media.status}</span>
              {media.averageScore && <span>⭐ {media.averageScore}/100</span>}
              {type === 'MANGA' && media.chapters && <span>{media.chapters} chapters</span>}
              {type === 'MANGA' && media.volumes && <span>{media.volumes} volumes</span>}
              {type === 'ANIME' && media.episodes && <span>{media.episodes} episodes</span>}
              {media.startDate.year && <span>{media.startDate.year}</span>}
              <span>👥 {media.popularity.toLocaleString()}</span>
              <span>❤️ {media.favourites.toLocaleString()}</span>
            </div>

            <div className="detail-genres">
              {media.genres.map((g) => (
                <span key={g} className="genre-tag">{g}</span>
              ))}
            </div>

            {visibleTags.length > 0 && (
              <div className="detail-genres" style={{ marginBottom: '1rem' }}>
                {visibleTags.map((t) => (
                  <span key={t.name} className="tag-tag">{t.name}</span>
                ))}
              </div>
            )}

            {media.description && (
              <p className="detail-description">{stripHtml(media.description)}</p>
            )}

            {media.characters.nodes.length > 0 && (
              <div className="characters">
                <h3>Characters</h3>
                <div className="char-grid">
                  {media.characters.nodes.map((c) => (
                    <div key={c.id} className="char-card">
                      <img src={c.image.medium} alt={c.name.full} />
                      <span>{c.name.full}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {feedback && <p className="feedback">{feedback}</p>}
            <button className="add-btn" onClick={addToList}>+ Add to my list</button>
          </div>
        </div>
      </div>
    </div>
  );
}
