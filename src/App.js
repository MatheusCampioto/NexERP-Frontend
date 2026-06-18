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
import Configuracoes from './pages/Configuracoes';
import Filial from './pages/Filial';
import Serie from './pages/Serie';
import CFOP from './pages/CFOP';
import Transportadora from './pages/Transportadora';
import TabelaPreco from './pages/TabelaPreco';
import TipoPedido from './pages/TipoPedido';
import Faturamento from './pages/Faturamento';

const RotaProtegida = ({ children }) => {
  const { token, carregando } = useAuth();
  if (carregando) return null;
  return token ? children : <Navigate to="/login" />;
};

const RotaComAcesso = ({ children, modulo }) => {
  const { temAcesso, carregando } = useAuth();
  if (carregando) return null;
  if (!temAcesso(modulo)) return <Navigate to="/" />;
  return children;
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
            <Route path="pessoas" element={<RotaComAcesso modulo="pessoas"><Pessoas /></RotaComAcesso>} />
            <Route path="produtos" element={<RotaComAcesso modulo="produtos"><Produtos /></RotaComAcesso>} />
            <Route path="estoque" element={<RotaComAcesso modulo="estoque"><Estoque /></RotaComAcesso>} />
            <Route path="pedidos" element={<RotaComAcesso modulo="pedidos"><Pedidos /></RotaComAcesso>} />
            <Route path="compras" element={<RotaComAcesso modulo="pedidos"><Compras /></RotaComAcesso>} />
            <Route path="financeiro" element={<RotaComAcesso modulo="financeiro"><Financeiro /></RotaComAcesso>} />
            <Route path="ordemservico" element={<RotaComAcesso modulo="pedidos"><OrdemServico /></RotaComAcesso>} />
            <Route path="relatorios" element={<RotaComAcesso modulo="relatorios"><Relatorios /></RotaComAcesso>} />
            <Route path="usuarios" element={<RotaComAcesso modulo="usuarios"><Usuarios /></RotaComAcesso>} />
            <Route path="perfil" element={<Perfil />} />
            <Route path="configuracoes" element={<Configuracoes />} />
            <Route path="filial" element={<Filial />} />
            <Route path="serie" element={<Serie />} />
            <Route path="cfop" element={<CFOP />} />
            <Route path="transportadora" element={<Transportadora />} />
            <Route path="tabelapreco" element={<TabelaPreco />} />
            <Route path="tipopedido" element={<TipoPedido />} />
            <Route path="faturamento" element={<Faturamento />} />


          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;