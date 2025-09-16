import { useEffect, useState } from 'react';

export default function SecureFetch() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError(new Error('No token found'));
      setLoading(false);
      return;
    }

    fetch('/api/secure-test', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>🔄 Loading secure content...</p>;
  if (error) return <p>❌ Error: {error.message}</p>;
  if (!data) return <p>⚠️ No data returned.</p>;

  return (
    <div>
      <h2>Auth Debug</h2>

      {loading && <p>🔄 Loading secure content...</p>}

      {error && <p style={{ color: 'red' }}>❌ Error: {error.message}</p>}

      {data && (
        <div>
          <h2>✅ Secure Content Loaded</h2>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}

      {!loading && !error && !data && <p>⚠️ No data returned. Check token or endpoint.</p>}
    </div>
  );
}
