import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag } from 'antd';
import {
  TeamOutlined, ShoppingOutlined, FileTextOutlined, DollarOutlined
} from '@ant-design/icons';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { listarPessoas } from '../services/pessoasService';
import { listarProdutos } from '../services/produtosService';
import { listarPedidos } from '../services/pedidosService';
import { listarLancamentos } from '../services/financeiroService';

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalPessoas: 0,
    totalProdutos: 0,
    totalPedidos: 0,
    receitaTotal: 0,
    despesaTotal: 0,
  });
  const [pedidosRecentes, setPedidosRecentes] = useState([]);
  const [graficoPedidos, setGraficoPedidos] = useState([]);
  const [graficoFinanceiro, setGraficoFinanceiro] = useState([]);
  const [produtosBaixoEstoque, setProdutosBaixoEstoque] = useState([]);

  useEffect(() => {
    const carregar = async () => {
      setLoading(true);
      try {
        const [pessoas, produtos, pedidos, lancamentos] = await Promise.all([
          listarPessoas(),
          listarProdutos(),
          listarPedidos(),
          listarLancamentos(),
        ]);

        const receitaTotal = lancamentos
          .filter(l => l.tipo === 'Receita' && l.status === 'Pago')
          .reduce((acc, l) => acc + l.valor, 0);

        const despesaTotal = lancamentos
          .filter(l => l.tipo === 'Despesa' && l.status === 'Pago')
          .reduce((acc, l) => acc + l.valor, 0);

        setStats({
          totalPessoas: pessoas.length,
          totalProdutos: produtos.length,
          totalPedidos: pedidos.length,
          receitaTotal,
          despesaTotal,
        });

        setPedidosRecentes(pedidos.slice(0, 5));

        // Gráfico pedidos por status
        const porStatus = pedidos.reduce((acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        }, {});
        setGraficoPedidos(Object.entries(porStatus).map(([status, total]) => ({ status, total })));

        // Gráfico financeiro
        const meses = {};
        lancamentos.forEach(l => {
          const mes = new Date(l.dataVencimento).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          if (!meses[mes]) meses[mes] = { mes, receita: 0, despesa: 0 };
          if (l.tipo === 'Receita') meses[mes].receita += l.valor;
          else meses[mes].despesa += l.valor;
        });
        setGraficoFinanceiro(Object.values(meses).slice(-6));

        // Produtos com estoque baixo
        setProdutosBaixoEstoque(
          produtos.filter(p => p.estoqueAtual <= p.estoqueMinimo)
        );

      } catch {
        console.error('Erro ao carregar dashboard.');
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, []);

  const statusCor = { Aberto: 'blue', Confirmado: 'green', Cancelado: 'red' };

  const colunasPedidos = [
    { title: '#', dataIndex: 'id', key: 'id' },
    { title: 'Cliente', dataIndex: ['pessoa', 'nome'], key: 'pessoa' },
    { title: 'Total', dataIndex: 'valorTotal', key: 'valorTotal', render: (v) => `R$ ${v?.toFixed(2)}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={statusCor[s]}>{s}</Tag> },
  ];

  const colunasProdutos = [
    { title: 'Produto', dataIndex: 'nome', key: 'nome' },
    { title: 'Estoque Atual', dataIndex: 'estoqueAtual', key: 'estoqueAtual' },
    { title: 'Estoque Mínimo', dataIndex: 'estoqueMinimo', key: 'estoqueMinimo' },
  ];

  return (
    <>
      <h2>Dashboard</h2>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic title="Pessoas" value={stats.totalPessoas} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic title="Produtos" value={stats.totalProdutos} prefix={<ShoppingOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic title="Pedidos" value={stats.totalPedidos} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Saldo"
              value={stats.receitaTotal - stats.despesaTotal}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: stats.receitaTotal - stats.despesaTotal >= 0 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Pedidos por Status" loading={loading}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={graficoPedidos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#1677ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Financeiro — Últimos 6 meses" loading={loading}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={graficoFinanceiro}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(v) => `R$ ${v.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="receita" stroke="#3f8600" name="Receita" />
                <Line type="monotone" dataKey="despesa" stroke="#cf1322" name="Despesa" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={14}>
          <Card title="Pedidos Recentes" loading={loading}>
            <Table dataSource={pedidosRecentes} columns={colunasPedidos} rowKey="id" pagination={false} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="⚠️ Produtos com Estoque Baixo" loading={loading}>
            <Table dataSource={produtosBaixoEstoque} columns={colunasProdutos} rowKey="id" pagination={false} />
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default Dashboard;