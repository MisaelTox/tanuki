import { useEffect, useState } from 'react';
import { userClient, searchClient } from '../api/client';
import { useNavigate } from 'react-router-dom';

interface ListItem {
  id: number;
  media_id: number;
  media_type: string;
  status: string;
  score: number | null;
  progress: number | null;
  is_favorite: boolean;
  title?: string;
  coverImage?: string;
}

export default function ListPage() {
  const [items, setItems] = useState<ListItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    userClient.get('/lists')
      .then(async (res) => {
        const listItems: ListItem[] = res.data;
        const enriched = await Promise.all(
          listItems.map(async (item) => {
            try {
              const detail = await searchClient.get(`/search/media/${item.media_id}?type=${item.media_type}`);
              return {
                ...item,
                title: detail.data.Media.title?.english || detail.data.Media.title?.romaji,
                coverImage: detail.data.Media.coverImage?.large,
              };
            } catch {
              return item;
            }
          })
        );
        setItems(enriched);
      })
      .catch(() => navigate('/login'));
  }, []);

  async function updateStatus(id: number, status: string) {
    await userClient.patch(`/lists/${id}`, { status });
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
  }

  async function removeItem(id: number) {
    await userClient.delete(`/lists/${id}`);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="page">
      <header>
        <h1>My List</h1>
        <button onClick={() => navigate('/search')}>Search</button>
      </header>
      <div className="results">
        {items.length === 0 && <p>Your list is empty. Go search some anime!</p>}
        {items.map((item) => (
          <div key={item.id} className="card">
            {item.coverImage
              ? <img src={item.coverImage} alt={item.title} />
              : <div style={{ width: '100%', height: '200px', background: '#2a2a2a' }} />
            }
            <div className="card-info">
              <h3>{item.title || `Media #${item.media_id}`}</h3>
              <select
                value={item.status}
                onChange={(e) => updateStatus(item.id, e.target.value)}
              >
                <option value="planning">Planning</option>
                <option value="watching">Watching</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
                <option value="dropped">Dropped</option>
              </select>
              <button onClick={() => removeItem(item.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
