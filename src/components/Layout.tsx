import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth';

export function Layout() {
  const { logout } = useAuth();
  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>Admin Ventas</h1>
        <nav>
          <NavLink to="/ventas" className={({ isActive }) => (isActive ? 'active' : '')}>
            Resumen de ventas
          </NavLink>
          <NavLink to="/categorias" className={({ isActive }) => (isActive ? 'active' : '')}>
            Categorías
          </NavLink>
          <NavLink to="/productos" className={({ isActive }) => (isActive ? 'active' : '')}>
            Productos
          </NavLink>
          <NavLink to="/insumos" className={({ isActive }) => (isActive ? 'active' : '')}>
            Insumos
          </NavLink>
          <NavLink to="/kiosko" className={({ isActive }) => (isActive ? 'active' : '')}>
            Kiosko
          </NavLink>
          <NavLink to="/sabores" className={({ isActive }) => (isActive ? 'active' : '')}>
            Sabores
          </NavLink>
          <NavLink to="/visitas" className={({ isActive }) => (isActive ? 'active' : '')}>
            Visitas web
          </NavLink>
        </nav>
        <button className="logout" onClick={logout}>Cerrar sesión</button>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
