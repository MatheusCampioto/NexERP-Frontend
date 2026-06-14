import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Alert } from 'antd';
import {
  TeamOutlined, ShoppingOutlined, FileTextOutlined, DollarOutlined,
  ArrowUpOutlined, ArrowDownOutlined, ToolOutlined
} from '@ant-design/icons';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { listarPessoas } from '../services/pessoasService';
import { listarProdutos } from '../services/produtosService';
import { listarPedidos } from '../services/pedidosService';
import { listarLancamentos } from '../services/financeiroService';
import { listarOrdensServico } from '../services/ordemServicoService';

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalPessoas: 0, totalProdutos: 0, totalPedidos: 0,
    receitaTotal: 0, despesaTotal: 0,
    pedidosPendentes: 0, ordensAbertas: 0,
    receitaMes: 0, despesaMes: 0,
  });
  const [pedidosRecentes, setPedidosRecentes] = useState([]);
  const [graficoPedidos, setGraficoPedidos] = useState([]);
  const [graficoFinanceiro, setGraficoFinanceiro] = useState([]);
  const [produtosBaixoEstoque, setProdutosBaixoEstoque] = useState([]);
  const [contasVencer, setContasVencer] = useState([]);

  useEffect(() => {
    const carregar = async () => {
      setLoading(true);
      try {
        const [pessoas, produtos, pedidos, lancamentos, ordens] = await Promise.all([
          listarPessoas(),
          listarProdutos(),
          listarPedidos(),
          listarLancamentos(),
          listarOrdensServico(),
        ]);

        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const em7Dias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);

        const receitaTotal = lancamentos
          .filter(l => l.tipo === 'Receita' && l.status === 'Pago')
          .reduce((acc, l) => acc + l.valor, 0);

        const despesaTotal = lancamentos
          .filter(l => l.tipo === 'Despesa' && l.status === 'Pago')
          .reduce((acc, l) => acc + l.valor, 0);

        const receitaMes = lancamentos
          .filter(l => l.tipo === 'Receita' && l.status === 'Pago' && new Date(l.dataPagamento) >= inicioMes)
          .reduce((acc, l) => acc + l.valor, 0);

        const despesaMes = lancamentos
          .filter(l => l.tipo === 'Despesa' && l.status === 'Pago' && new Date(l.dataPagamento) >= inicioMes)
          .reduce((acc, l) => acc + l.valor, 0);

        const pedidosPendentes = pedidos.filter(p => p.status === 'Pedido' || p.status === 'Confirmado').length;
        const ordensAbertas = ordens.filter(o => o.status === 'Aberta' || o.status === 'EmAndamento').length;

        // Contas a vencer nos próximos 7 dias
        const vencer = lancamentos.filter(l =>
          l.status === 'Pendente' &&
          new Date(l.dataVencimento) <= em7Dias &&
          new Date(l.dataVencimento) >= hoje
        ).sort((a, b) => new Date(a.dataVencimento) - new Date(b.dataVencimento));

        setStats({
          totalPessoas: pessoas.length,
          totalProdutos: produtos.length,
          totalPedidos: pedidos.length,
          receitaTotal, despesaTotal,
          pedidosPendentes, ordensAbertas,
          receitaMes, despesaMes,
        });

        setPedidosRecentes(pedidos.slice(0, 5));
        setContasVencer(vencer.slice(0, 5));

        const porStatus = pedidos.reduce((acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        }, {});
        setGraficoPedidos(Object.entries(porStatus).map(([status, total]) => ({ status, total })));

        const meses = {};
        lancamentos.forEach(l => {
          const mes = new Date(l.dataVencimento).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          if (!meses[mes]) meses[mes] = { mes, receita: 0, despesa: 0 };
          if (l.tipo === 'Receita') meses[mes].receita += l.valor;
          else meses[mes].despesa += l.valor;
        });
        setGraficoFinanceiro(Object.values(meses).slice(-6));

        setProdutosBaixoEstoque(produtos.filter(p => p.estoqueAtual <= p.estoqueMinimo));

      } catch (e) {
        console.error('Erro ao carregar dashboard.', e);
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, []);

  const statusCor = { Orcamento: 'default', Pedido: 'blue', Confirmado: 'green', Cancelado: 'red' };

  const colunasPedidos = [
    { title: '#', dataIndex: 'id', key: 'id', width: 50 },
    { title: 'Cliente', key: 'pessoa', render: (_, r) => r.pessoa?.nome || '-' },
    { title: 'Total', dataIndex: 'valorTotal', key: 'valorTotal', render: (v) => `R$ ${v?.toFixed(2)}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={statusCor[s]}>{s}</Tag> },
  ];

  const colunasProdutos = [
    { title: 'Produto', dataIndex: 'nome', key: 'nome' },
    { title: 'Atual', dataIndex: 'estoqueAtual', key: 'estoqueAtual', render: v => <Tag color="red">{v}</Tag> },
    { title: 'Mínimo', dataIndex: 'estoqueMinimo', key: 'estoqueMinimo' },
  ];

  const colunasContas = [
    { title: 'Descrição', dataIndex: 'descricao', key: 'descricao' },
    { title: 'Tipo', dataIndex: 'tipo', key: 'tipo', render: t => <Tag color={t === 'Receita' ? 'green' : 'red'}>{t}</Tag> },
    { title: 'Valor', dataIndex: 'valor', key: 'valor', render: v => `R$ ${v?.toFixed(2)}` },
    { title: 'Vencimento', dataIndex: 'dataVencimento', key: 'dataVencimento', render: d => new Date(d).toLocaleDateString('pt-BR') },
  ];

  const saldo = stats.receitaTotal - stats.despesaTotal;

  return (
    <>
      <h2>Painel</h2>

      {produtosBaixoEstoque.length > 0 && (
        <Alert
          message={`⚠️ ${produtosBaixoEstoque.length} produto(s) com estoque abaixo do mínimo`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      {contasVencer.length > 0 && (
        <Alert
          message={`📅 ${contasVencer.length} conta(s) vencem nos próximos 7 dias`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic title="Pessoas Cadastradas" value={stats.totalPessoas} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic title="Produtos Ativos" value={stats.totalProdutos} prefix={<ShoppingOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic title="Pedidos Pendentes" value={stats.pedidosPendentes} prefix={<FileTextOutlined />} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic title="OS Abertas" value={stats.ordensAbertas} prefix={<ToolOutlined />} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Receita do Mês"
              value={stats.receitaMes}
              precision={2}
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#3f8600' }}
              suffix="R$"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Despesa do Mês"
              value={stats.despesaMes}
              precision={2}
              prefix={<ArrowDownOutlined />}
              valueStyle={{ color: '#cf1322' }}
              suffix="R$"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Receita Total"
              value={stats.receitaTotal}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#3f8600' }}
              suffix="R$"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Saldo Geral"
              value={saldo}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: saldo >= 0 ? '#3f8600' : '#cf1322' }}
              suffix="R$"
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
            <Table dataSource={pedidosRecentes} columns={colunasPedidos} rowKey="id" pagination={false} size="small" />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="⚠️ Estoque Baixo" loading={loading}>
            <Table dataSource={produtosBaixoEstoque} columns={colunasProdutos} rowKey="id" pagination={false} size="small" />
          </Card>
        </Col>
      </Row>

      {contasVencer.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24}>
            <Card title="📅 Contas a Vencer nos Próximos 7 Dias" loading={loading}>
              <Table dataSource={contasVencer} columns={colunasContas} rowKey="id" pagination={false} size="small" />
            </Card>
          </Col>
        </Row>
      )}
    </>
  );
};

export default Dashboard;