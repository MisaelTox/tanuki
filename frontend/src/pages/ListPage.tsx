import { useEffect, useState } from 'react';
import { userClient } from '../api/client';
import { useNavigate } from 'react-router-dom';

interface ListItem {
  id: string;
  animeId: number;
  title: string;
  coverImage: string;
  status: string;
}

export default function ListPage() {
  const [items, setItems] = useState<ListItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    userClient.get('/lists')
      .then((res) => setItems(res.data))
      .catch(() => navigate('/login'));
  }, []);

  async function updateStatus(id: string, status: string) {
    await userClient.patch(`/lists/${id}`, { status });
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
  }

  async function removeItem(id: string) {
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
            <img src={item.coverImage} alt={item.title} />
            <div className="card-info">
              <h3>{item.title}</h3>
              <select
                value={item.status}
                onChange={(e) => updateStatus(item.id, e.target.value)}
              >
                <option value="plan_to_watch">Plan to watch</option>
                <option value="watching">Watching</option>
                <option value="completed">Completed</option>
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
