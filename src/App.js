import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pessoas from './pages/Pessoas';
import Produtos from './pages/Produtos';
import Estoque from './pages/Estoque';
import Pedidos from './pages/Pedidos';
import Financeiro from './pages/Financeiro';
import Relatorios from './pages/Relatorios';
import Usuarios from './pages/Usuarios';
import OrdemServico from './pages/OrdemServico';
import Compras from './pages/Compras';
import Perfil from './pages/Perfil';

const RotaProtegida = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <RotaProtegida>
              <AppLayout />
            </RotaProtegida>
          }>
            <Route index element={<Dashboard />} />
            <Route path="pessoas" element={<Pessoas />} />
            <Route path="produtos" element={<Produtos />} />
            <Route path="estoque" element={<Estoque />} />
            <Route path="pedidos" element={<Pedidos />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="ordemservico" element={<OrdemServico />} />
            <Route path="compras" element={<Compras />} />
            <Route path="perfil" element={<Perfil />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;