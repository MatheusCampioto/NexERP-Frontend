import { useState, useEffect } from 'react';
import { Layout, Menu, Badge } from 'antd';
import {
  DashboardOutlined, TeamOutlined, ShoppingOutlined,
  InboxOutlined, FileTextOutlined, DollarOutlined,
  LogoutOutlined, BarChartOutlined, UserOutlined, ToolOutlined, ShoppingCartOutlined, BellOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listarSolicitacoes } from '../services/comprasService';
import { listarLancamentos } from '../services/financeiroService';
import { listarProdutos } from '../services/produtosService';
import { SettingOutlined } from '@ant-design/icons';

const { Sider, Content, Header } = Layout;

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, logout, temAcesso } = useAuth();
  const [badges, setBadges] = useState({ solicitacoes: 0, contas: 0, estoque: 0 });

  useEffect(() => {
    const carregarAlertas = async () => {
      try {
        const [solicitacoes, lancamentos, produtos] = await Promise.all([
          listarSolicitacoes(),
          listarLancamentos(),
          listarProdutos(),
        ]);

        const hoje = new Date();
        const em3Dias = new Date(hoje.getTime() + 3 * 24 * 60 * 60 * 1000);

        const solicitacoesPendentes = solicitacoes.filter(s => s.status === 'Pendente').length;
        const contasVencendo = lancamentos.filter(l =>
          l.status === 'Pendente' && new Date(l.dataVencimento) <= em3Dias && new Date(l.dataVencimento) >= hoje
        ).length;
        const estoqueBaixo = produtos.filter(p => p.estoqueAtual <= p.estoqueMinimo).length;

        setBadges({ solicitacoes: solicitacoesPendentes, contas: contasVencendo, estoque: estoqueBaixo });
      } catch { }
    };

    carregarAlertas();
    const interval = setInterval(carregarAlertas, 60000);
    return () => clearInterval(interval);
  }, []);

  const todosItens = [
    { key: '/', icon: <DashboardOutlined />, label: 'Painel', modulo: null },
    { key: '/pessoas', icon: <TeamOutlined />, label: 'Pessoas', modulo: 'pessoas' },
    { key: '/produtos', icon: <ShoppingOutlined />, label: <span style={{ color: 'white' }}>Produtos {badges.estoque > 0 && <Badge count={badges.estoque} size="small" style={{ marginLeft: 4 }} />}</span>, modulo: 'produtos' },
    { key: '/estoque', icon: <InboxOutlined />, label: <span style={{ color: 'white' }}>Estoque {badges.estoque > 0 && <Badge count={badges.estoque} size="small" style={{ marginLeft: 4 }} />}</span>, modulo: 'estoque' },
    { key: '/pedidos', icon: <FileTextOutlined />, label: 'Pedidos', modulo: 'pedidos' },
    { key: '/compras', icon: <ShoppingCartOutlined />, label: <span style={{ color: 'white' }}>Compras {badges.solicitacoes > 0 && <Badge count={badges.solicitacoes} size="small" style={{ marginLeft: 4 }} />}</span>, modulo: 'pedidos' },
    { key: '/financeiro', icon: <DollarOutlined />, label: <span style={{ color: 'white' }}>Financeiro {badges.contas > 0 && <Badge count={badges.contas} size="small" style={{ marginLeft: 4 }} />}</span>, modulo: 'financeiro' },
    { key: '/ordemservico', icon: <ToolOutlined />, label: 'Ordem de Serviço', modulo: 'pedidos' },
    { key: '/relatorios', icon: <BarChartOutlined />, label: 'Relatórios', modulo: 'relatorios' },
    { key: '/usuarios', icon: <UserOutlined />, label: 'Usuários', modulo: 'usuarios' },
    { key: '/perfil', icon: <UserOutlined />, label: 'Meu Perfil', modulo: null },
    { key: '/configuracoes', icon: <SettingOutlined />, label: 'Configurações', modulo: null },
    { key: '/logout', icon: <LogoutOutlined />, label: 'Sair', danger: true, modulo: null },
  ];

  const menuItems = todosItens.filter(item => {
    if (item.modulo === null) return true;
    return temAcesso(item.modulo);
  });

  const handleMenu = ({ key }) => {
    if (key === '/logout') {
      logout();
      navigate('/login');
    } else {
      navigate(key);
    }
  };

  const totalAlertas = badges.solicitacoes + badges.contas + badges.estoque;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" breakpoint="lg" collapsedWidth="0">
        <div style={{ color: 'white', textAlign: 'center', padding: '16px', fontWeight: 'bold', fontSize: 18 }}>
          NexERP
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenu}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16 }}>
          <Badge count={totalAlertas} size="small">
            <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
          </Badge>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/perfil')}>
            Olá, {usuario?.nome}
          </span>
        </Header>
        <Content style={{ margin: '24px', background: '#fff', padding: '24px', borderRadius: 8 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;