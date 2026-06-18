import { useState, useEffect } from 'react';
import { Layout, Menu, Badge } from 'antd';
import {
  DashboardOutlined, TeamOutlined, ShoppingOutlined,
  DollarOutlined, LogoutOutlined, UserOutlined,
  BellOutlined, SettingOutlined, BankOutlined, OrderedListOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listarSolicitacoes } from '../services/comprasService';
import { listarLancamentos } from '../services/financeiroService';
import { listarProdutos } from '../services/produtosService';

const { Sider, Content, Header } = Layout;

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, logout } = useAuth();
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
        setBadges({
          solicitacoes: solicitacoes.filter(s => s.status === 'Pendente').length,
          contas: lancamentos.filter(l => l.status === 'Pendente' && new Date(l.dataVencimento) <= em3Dias && new Date(l.dataVencimento) >= hoje).length,
          estoque: produtos.filter(p => p.estoqueAtual <= p.estoqueMinimo).length,
        });
      } catch { }
    };
    carregarAlertas();
    const interval = setInterval(carregarAlertas, 60000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Painel',
    },
    {
      key: 'comercial',
      icon: <ShoppingOutlined />,
      label: 'Gestão Comercial',
      children: [
        { key: '/produtos', label: <span>Produtos {badges.estoque > 0 && <Badge count={badges.estoque} size="small" style={{ marginLeft: 4 }} />}</span> },
        { key: '/estoque', label: <span>Estoque {badges.estoque > 0 && <Badge count={badges.estoque} size="small" style={{ marginLeft: 4 }} />}</span> },
        { key: '/pedidos', label: 'Pedidos' },
        { key: '/compras', label: <span>Compras {badges.solicitacoes > 0 && <Badge count={badges.solicitacoes} size="small" style={{ marginLeft: 4 }} />}</span> },
        { key: '/ordemservico', label: 'Ordem de Serviço' },
        { key: '/faturamento', label: 'Faturamento' },
        { key: '/tabelapreco', label: 'Tabelas de Preço' },
      ]
    },
    {
      key: 'financeira',
      icon: <DollarOutlined />,
      label: 'Gestão Financeira',
      children: [
        { key: '/financeiro', label: <span>Financeiro {badges.contas > 0 && <Badge count={badges.contas} size="small" style={{ marginLeft: 4 }} />}</span> },
        { key: '/relatorios', label: 'Relatórios' },
      ]
    },
    {
      key: 'gestao-pessoas',
      icon: <TeamOutlined />,
      label: 'Gestão de Pessoas',
      children: [
        { key: '/pessoas', label: 'Pessoas' },
        
      ]
    },
    {
      key: 'administracao',
      icon: <SettingOutlined />,
      label: 'Administração',
      children: [
        { key: '/filial', icon: <BankOutlined />, label: 'Filial' },
        { key: '/configuracoes', icon: <SettingOutlined />, label: 'Configurações' },
        { key: '/usuarios', icon: <UserOutlined />, label: 'Usuários' },
        { key: '/serie', icon: <OrderedListOutlined />, label: 'Séries' },
        { key: '/cfop', icon: <OrderedListOutlined />, label: 'CFOP' },
      ]
    },
    { key: '/perfil', icon: <UserOutlined />, label: 'Meu Perfil' },
    { key: '/logout', icon: <LogoutOutlined />, label: 'Sair', danger: true },
  ];

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
      <Sider theme="dark" breakpoint="lg" collapsedWidth="0" width={220}>
        <div style={{ color: 'white', textAlign: 'center', padding: '16px', fontWeight: 'bold', fontSize: 18 }}>
          NexERP
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultOpenKeys={['comercial']}
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