import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, RequireAuth } from './auth';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { CategoriasPage } from './pages/CategoriasPage';
import { ProductosPage } from './pages/ProductosPage';
import { VentasPage } from './pages/VentasPage';

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<Navigate to="/ventas" replace />} />
          <Route path="/ventas" element={<VentasPage />} />
          <Route path="/categorias" element={<CategoriasPage />} />
          <Route path="/productos" element={<ProductosPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
