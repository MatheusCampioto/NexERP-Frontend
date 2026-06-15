import { Layout, Menu } from 'antd';
import {
  DashboardOutlined, TeamOutlined, ShoppingOutlined,
  InboxOutlined, FileTextOutlined, DollarOutlined,
  LogoutOutlined, BarChartOutlined, UserOutlined, ToolOutlined, ShoppingCartOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Sider, Content, Header } = Layout;

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, logout } = useAuth();

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Painel' },
    { key: '/pessoas', icon: <TeamOutlined />, label: 'Pessoas' },
    { key: '/produtos', icon: <ShoppingOutlined />, label: 'Produtos' },
    { key: '/estoque', icon: <InboxOutlined />, label: 'Estoque' },
    { key: '/pedidos', icon: <FileTextOutlined />, label: 'Pedidos' },
    { key: '/compras', icon: <ShoppingCartOutlined />, label: 'Compras' },
    { key: '/financeiro', icon: <DollarOutlined />, label: 'Financeiro' },
    { key: '/ordemservico', icon: <ToolOutlined />, label: 'Ordem de Serviço' },
    { key: '/relatorios', icon: <BarChartOutlined />, label: 'Relatórios' },
    { key: '/usuarios', icon: <UserOutlined />, label: 'Usuários' },
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
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
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