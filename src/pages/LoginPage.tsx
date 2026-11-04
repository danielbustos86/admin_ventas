import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { api } from '../api/client';

export function LoginPage() {
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.get('/api/categorias', { headers: { 'x-api-key': key } });
      login(key);
      const to = location.state?.from?.pathname ?? '/ventas';
      navigate(to, { replace: true });
    } catch (err: any) {
      setError(
        err.response?.status === 401
          ? 'API key inválida'
          : 'No se pudo conectar al backend. Revisa VITE_API_BASE_URL.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Panel de administración</h1>
        <label>API Key</label>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="x-api-key"
          autoFocus
          style={{ width: '100%' }}
        />
        <button type="submit" disabled={loading || !key} style={{ marginTop: 16, width: '100%' }}>
          {loading ? 'Verificando…' : 'Entrar'}
        </button>
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  );
}
