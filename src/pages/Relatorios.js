import { useState } from 'react';
import { Card, Button, DatePicker, Select, Row, Col, Table, message, Space, Statistic, Tag } from 'antd';
import { FilePdfOutlined, FileExcelOutlined, SearchOutlined } from '@ant-design/icons';
import { listarPedidos } from '../services/pedidosService';
import { listarLancamentos } from '../services/financeiroService';
import { listarProdutos } from '../services/produtosService';
import { listarPessoas } from '../services/pessoasService';
import { listarOrdensServico } from '../services/ordemServicoService';
import { listarSolicitacoes, listarOrdensCompra, listarNotasFiscais } from '../services/comprasService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const tiposRelatorio = [
  { value: 'pedidos', label: 'Pedidos' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'estoque', label: 'Estoque' },
  { value: 'pessoas', label: 'Pessoas' },
  { value: 'ordemservico', label: 'Ordens de Serviço' },
  { value: 'compras', label: 'Ordens de Compra' },
  { value: 'nfentrada', label: 'NF de Entrada' },
];

const statusPorTipo = {
  pedidos: ['Orcamento', 'Pedido', 'Confirmado', 'Cancelado'],
  financeiro: ['Pendente', 'Pago', 'Cancelado'],
  ordemservico: ['Aberta', 'EmAndamento', 'Concluida', 'Cancelada'],
  compras: ['Aberta', 'Enviada', 'Recebida', 'Cancelada'],
};

const Relatorios = () => {
  const [tipoRelatorio, setTipoRelatorio] = useState('pedidos');
  const [periodo, setPeriodo] = useState(null);
  const [statusFiltro, setStatusFiltro] = useState(null);
  const [dados, setDados] = useState([]);
  const [totais, setTotais] = useState({});
  const [loading, setLoading] = useState(false);

  const temPeriodo = !['estoque', 'pessoas'].includes(tipoRelatorio);
  const temStatus = Object.keys(statusPorTipo).includes(tipoRelatorio);

  const filtrarPorPeriodo = (lista, campoData) => {
    if (!periodo) return lista;
    return lista.filter(item => {
      const data = new Date(item[campoData]);
      return data >= periodo[0].toDate() && data <= periodo[1].toDate();
    });
  };

  const filtrarPorStatus = (lista) => {
    if (!statusFiltro) return lista;
    return lista.filter(item => item.status === statusFiltro);
  };

  const gerar = async () => {
    setLoading(true);
    try {
      let resultado = [];
      let totaisCalc = {};

      if (tipoRelatorio === 'pedidos') {
        const pedidos = await listarPedidos();
        resultado = filtrarPorStatus(filtrarPorPeriodo(pedidos, 'criadoEm'));
        totaisCalc = {
          total: resultado.length,
          valorTotal: resultado.reduce((acc, p) => acc + (p.valorTotal || 0), 0),
          confirmados: resultado.filter(p => p.status === 'Confirmado').length,
          cancelados: resultado.filter(p => p.status === 'Cancelado').length,
        };
      } else if (tipoRelatorio === 'financeiro') {
        const lancamentos = await listarLancamentos();
        resultado = filtrarPorStatus(filtrarPorPeriodo(lancamentos, 'dataVencimento'));
        const receitas = resultado.filter(l => l.tipo === 'Receita').reduce((acc, l) => acc + l.valor, 0);
        const despesas = resultado.filter(l => l.tipo === 'Despesa').reduce((acc, l) => acc + l.valor, 0);
        totaisCalc = { total: resultado.length, receitas, despesas, saldo: receitas - despesas };
      } else if (tipoRelatorio === 'estoque') {
        resultado = await listarProdutos();
        totaisCalc = {
          total: resultado.length,
          baixoEstoque: resultado.filter(p => p.estoqueAtual <= p.estoqueMinimo).length,
          valorEstoque: resultado.reduce((acc, p) => acc + (p.estoqueAtual * p.precoCusto), 0),
        };
      } else if (tipoRelatorio === 'pessoas') {
        resultado = await listarPessoas();
        totaisCalc = {
          total: resultado.length,
          clientes: resultado.filter(p => p.tipo === 'Cliente').length,
          fornecedores: resultado.filter(p => p.tipo === 'Fornecedor').length,
          representantes: resultado.filter(p => p.tipo === 'Representante').length,
        };
      } else if (tipoRelatorio === 'ordemservico') {
        const ordens = await listarOrdensServico();
        resultado = filtrarPorStatus(filtrarPorPeriodo(ordens, 'criadoEm'));
        totaisCalc = {
          total: resultado.length,
          abertas: resultado.filter(o => o.status === 'Aberta').length,
          concluidas: resultado.filter(o => o.status === 'Concluida').length,
          valorTotal: resultado.reduce((acc, o) => acc + (o.valorFinal || o.valorEstimado || 0), 0),
        };
      } else if (tipoRelatorio === 'compras') {
        const ordens = await listarOrdensCompra();
        resultado = filtrarPorStatus(filtrarPorPeriodo(ordens, 'criadoEm'));
        totaisCalc = {
          total: resultado.length,
          valorTotal: resultado.reduce((acc, o) => acc + (o.valorTotal || 0), 0),
          recebidas: resultado.filter(o => o.status === 'Recebida').length,
        };
      } else if (tipoRelatorio === 'nfentrada') {
        const notas = await listarNotasFiscais();
        resultado = filtrarPorPeriodo(notas, 'dataEmissao');
        totaisCalc = {
          total: resultado.length,
          valorTotal: resultado.reduce((acc, n) => acc + (n.valorTotal || 0), 0),
          atualizadas: resultado.filter(n => n.estoqueAtualizado).length,
        };
      }

      setDados(resultado);
      setTotais(totaisCalc);
      if (resultado.length === 0) message.warning('Nenhum dado encontrado.');
    } catch {
      message.error('Erro ao gerar relatório.');
    } finally {
      setLoading(false);
    }
  };

  const getColunas = () => {
    if (tipoRelatorio === 'pedidos') return [
      { title: '#', dataIndex: 'id', key: 'id', width: 60 },
      { title: 'Cliente', key: 'cliente', render: (_, r) => r.pessoa?.nome || '-' },
      { title: 'Status', dataIndex: 'status', key: 'status', render: s => <Tag>{s}</Tag> },
      { title: 'Forma Pagamento', dataIndex: 'formaPagamento', key: 'formaPagamento' },
      { title: 'Valor Total', dataIndex: 'valorTotal', key: 'valorTotal', render: v => `R$ ${v?.toFixed(2)}` },
      { title: 'Data', dataIndex: 'criadoEm', key: 'criadoEm', render: d => dayjs(d).format('DD/MM/YYYY') },
    ];
    if (tipoRelatorio === 'financeiro') return [
      { title: 'Descrição', dataIndex: 'descricao', key: 'descricao' },
      { title: 'Tipo', dataIndex: 'tipo', key: 'tipo', render: t => <Tag color={t === 'Receita' ? 'green' : 'red'}>{t}</Tag> },
      { title: 'Valor', dataIndex: 'valor', key: 'valor', render: v => `R$ ${v?.toFixed(2)}` },
      { title: 'Status', dataIndex: 'status', key: 'status', render: s => <Tag color={s === 'Pago' ? 'green' : s === 'Pendente' ? 'orange' : 'red'}>{s}</Tag> },
      { title: 'Vencimento', dataIndex: 'dataVencimento', key: 'dataVencimento', render: d => dayjs(d).format('DD/MM/YYYY') },
      { title: 'Pagamento', dataIndex: 'dataPagamento', key: 'dataPagamento', render: d => d ? dayjs(d).format('DD/MM/YYYY') : '-' },
    ];
    if (tipoRelatorio === 'estoque') return [
      { title: 'Produto', dataIndex: 'nome', key: 'nome' },
      { title: 'Código', dataIndex: 'codigo', key: 'codigo' },
      { title: 'NCM', dataIndex: 'ncm', key: 'ncm' },
      { title: 'Estoque Atual', dataIndex: 'estoqueAtual', key: 'estoqueAtual', render: (v, r) => <Tag color={v <= r.estoqueMinimo ? 'red' : 'green'}>{v}</Tag> },
      { title: 'Estoque Mín.', dataIndex: 'estoqueMinimo', key: 'estoqueMinimo' },
      { title: 'Preço Custo', dataIndex: 'precoCusto', key: 'precoCusto', render: v => `R$ ${v?.toFixed(2)}` },
      { title: 'Preço Venda', dataIndex: 'precoVenda', key: 'precoVenda', render: v => `R$ ${v?.toFixed(2)}` },
      { title: 'Valor em Estoque', key: 'valorEstoque', render: (_, r) => `R$ ${(r.estoqueAtual * r.precoCusto).toFixed(2)}` },
    ];
    if (tipoRelatorio === 'pessoas') return [
      { title: 'Nome / Razão Social', key: 'nome', render: (_, r) => r.razaoSocial || r.nome },
      { title: 'Tipo', dataIndex: 'tipo', key: 'tipo', render: t => <Tag color={t === 'Cliente' ? 'blue' : t === 'Fornecedor' ? 'green' : 'purple'}>{t}</Tag> },
      { title: 'Documento', key: 'documento', render: (_, r) => r.cnpj || r.cpf || '-' },
      { title: 'E-mail', dataIndex: 'email', key: 'email' },
      { title: 'Cidade', dataIndex: 'cidade', key: 'cidade' },
      { title: 'Estado', dataIndex: 'estado', key: 'estado' },
    ];
    if (tipoRelatorio === 'ordemservico') return [
      { title: '#', dataIndex: 'id', key: 'id', width: 60 },
      { title: 'Título', dataIndex: 'titulo', key: 'titulo' },
      { title: 'Cliente', key: 'cliente', render: (_, r) => r.pessoa?.nome || '-' },
      { title: 'Status', dataIndex: 'status', key: 'status', render: s => <Tag>{s}</Tag> },
      { title: 'Prioridade', dataIndex: 'prioridade', key: 'prioridade' },
      { title: 'Valor Final', dataIndex: 'valorFinal', key: 'valorFinal', render: v => v ? `R$ ${v.toFixed(2)}` : '-' },
      { title: 'Data', dataIndex: 'criadoEm', key: 'criadoEm', render: d => dayjs(d).format('DD/MM/YYYY') },
    ];
    if (tipoRelatorio === 'compras') return [
      { title: '#', dataIndex: 'id', key: 'id', width: 60 },
      { title: 'Fornecedor', key: 'fornecedor', render: (_, r) => r.fornecedor?.razaoSocial || r.fornecedor?.nome || '-' },
      { title: 'Status', dataIndex: 'status', key: 'status', render: s => <Tag>{s}</Tag> },
      { title: 'Valor Total', dataIndex: 'valorTotal', key: 'valorTotal', render: v => `R$ ${v?.toFixed(2)}` },
      { title: 'Prev. Entrega', dataIndex: 'dataPrevista', key: 'dataPrevista', render: d => d ? dayjs(d).format('DD/MM/YYYY') : '-' },
      { title: 'Data', dataIndex: 'criadoEm', key: 'criadoEm', render: d => dayjs(d).format('DD/MM/YYYY') },
    ];
    if (tipoRelatorio === 'nfentrada') return [
      { title: '#', dataIndex: 'id', key: 'id', width: 60 },
      { title: 'NF', dataIndex: 'numeroNF', key: 'numeroNF' },
      { title: 'Fornecedor', key: 'fornecedor', render: (_, r) => r.ordemCompra?.fornecedor?.razaoSocial || '-' },
      { title: 'Valor Total', dataIndex: 'valorTotal', key: 'valorTotal', render: v => `R$ ${v?.toFixed(2)}` },
      { title: 'Emissão', dataIndex: 'dataEmissao', key: 'dataEmissao', render: d => dayjs(d).format('DD/MM/YYYY') },
      { title: 'Estoque', dataIndex: 'estoqueAtualizado', key: 'estoqueAtualizado', render: v => <Tag color={v ? 'green' : 'orange'}>{v ? 'Atualizado' : 'Pendente'}</Tag> },
    ];
    return [];
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    const titulo = tiposRelatorio.find(t => t.value === tipoRelatorio)?.label || tipoRelatorio;
    const agora = dayjs().format('DD/MM/YYYY HH:mm');

    doc.setFontSize(16);
    doc.text(`NexERP - Relatório de ${titulo}`, 14, 16);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${agora}`, 14, 23);
    if (periodo) doc.text(`Período: ${periodo[0].format('DD/MM/YYYY')} a ${periodo[1].format('DD/MM/YYYY')}`, 14, 29);

    const colunas = getColunas().map(c => c.title);
    const linhas = dados.map(d => getColunas().map(c => {
      if (c.dataIndex) {
        const val = d[c.dataIndex];
        if (c.dataIndex?.includes('Em') || c.dataIndex?.includes('data') || c.dataIndex?.includes('Data')) {
          return val ? dayjs(val).format('DD/MM/YYYY') : '-';
        }
        if (typeof val === 'number') return `R$ ${val.toFixed(2)}`;
        return val ?? '-';
      }
      return '-';
    }));

    autoTable(doc, {
      head: [colunas],
      body: linhas,
      startY: periodo ? 35 : 29,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 119, 255] },
    });

    doc.save(`relatorio_${tipoRelatorio}_${dayjs().format('YYYYMMDD')}.pdf`);
  };

  const exportarExcel = () => {
    const linhas = dados.map(d => {
      const obj = {};
      getColunas().forEach(c => {
        if (c.dataIndex) {
          const val = d[c.dataIndex];
          obj[c.title] = val ?? '';
        } else {
          obj[c.title] = '';
        }
      });
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(linhas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf]), `relatorio_${tipoRelatorio}_${dayjs().format('YYYYMMDD')}.xlsx`);
  };

  const renderTotais = () => {
    if (!totais || Object.keys(totais).length === 0) return null;
    return (
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {tipoRelatorio === 'pedidos' && <>
          <Col span={6}><Card><Statistic title="Total de Pedidos" value={totais.total} /></Card></Col>
          <Col span={6}><Card><Statistic title="Valor Total" value={totais.valorTotal} precision={2} prefix="R$" /></Card></Col>
          <Col span={6}><Card><Statistic title="Confirmados" value={totais.confirmados} valueStyle={{ color: 'green' }} /></Card></Col>
          <Col span={6}><Card><Statistic title="Cancelados" value={totais.cancelados} valueStyle={{ color: 'red' }} /></Card></Col>
        </>}
        {tipoRelatorio === 'financeiro' && <>
          <Col span={6}><Card><Statistic title="Receitas" value={totais.receitas} precision={2} prefix="R$" valueStyle={{ color: 'green' }} /></Card></Col>
          <Col span={6}><Card><Statistic title="Despesas" value={totais.despesas} precision={2} prefix="R$" valueStyle={{ color: 'red' }} /></Card></Col>
          <Col span={6}><Card><Statistic title="Saldo" value={totais.saldo} precision={2} prefix="R$" valueStyle={{ color: totais.saldo >= 0 ? 'green' : 'red' }} /></Card></Col>
          <Col span={6}><Card><Statistic title="Lançamentos" value={totais.total} /></Card></Col>
        </>}
        {tipoRelatorio === 'estoque' && <>
          <Col span={8}><Card><Statistic title="Total de Produtos" value={totais.total} /></Card></Col>
          <Col span={8}><Card><Statistic title="Estoque Baixo" value={totais.baixoEstoque} valueStyle={{ color: 'red' }} /></Card></Col>
          <Col span={8}><Card><Statistic title="Valor em Estoque" value={totais.valorEstoque} precision={2} prefix="R$" /></Card></Col>
        </>}
        {tipoRelatorio === 'pessoas' && <>
          <Col span={6}><Card><Statistic title="Total" value={totais.total} /></Card></Col>
          <Col span={6}><Card><Statistic title="Clientes" value={totais.clientes} valueStyle={{ color: '#1677ff' }} /></Card></Col>
          <Col span={6}><Card><Statistic title="Fornecedores" value={totais.fornecedores} valueStyle={{ color: 'green' }} /></Card></Col>
          <Col span={6}><Card><Statistic title="Representantes" value={totais.representantes} valueStyle={{ color: 'purple' }} /></Card></Col>
        </>}
        {tipoRelatorio === 'ordemservico' && <>
          <Col span={6}><Card><Statistic title="Total de OS" value={totais.total} /></Card></Col>
          <Col span={6}><Card><Statistic title="Abertas" value={totais.abertas} valueStyle={{ color: '#1677ff' }} /></Card></Col>
          <Col span={6}><Card><Statistic title="Concluídas" value={totais.concluidas} valueStyle={{ color: 'green' }} /></Card></Col>
          <Col span={6}><Card><Statistic title="Valor Total" value={totais.valorTotal} precision={2} prefix="R$" /></Card></Col>
        </>}
        {tipoRelatorio === 'compras' && <>
          <Col span={8}><Card><Statistic title="Total de OC" value={totais.total} /></Card></Col>
          <Col span={8}><Card><Statistic title="Recebidas" value={totais.recebidas} valueStyle={{ color: 'green' }} /></Card></Col>
          <Col span={8}><Card><Statistic title="Valor Total" value={totais.valorTotal} precision={2} prefix="R$" /></Card></Col>
        </>}
        {tipoRelatorio === 'nfentrada' && <>
          <Col span={8}><Card><Statistic title="Total de NFs" value={totais.total} /></Card></Col>
          <Col span={8}><Card><Statistic title="Estoque Atualizado" value={totais.atualizadas} valueStyle={{ color: 'green' }} /></Card></Col>
          <Col span={8}><Card><Statistic title="Valor Total" value={totais.valorTotal} precision={2} prefix="R$" /></Card></Col>
        </>}
      </Row>
    );
  };

  return (
    <>
      <h2>Relatórios</h2>
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={6}>
            <Select value={tipoRelatorio} onChange={v => { setTipoRelatorio(v); setDados([]); setTotais({}); setStatusFiltro(null); }} style={{ width: '100%' }}>
              {tiposRelatorio.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
            </Select>
          </Col>
          {temPeriodo && (
            <Col xs={24} sm={8}>
              <RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" onChange={setPeriodo} />
            </Col>
          )}
          {temStatus && (
            <Col xs={24} sm={4}>
              <Select allowClear placeholder="Status" style={{ width: '100%' }} onChange={setStatusFiltro}>
                {(statusPorTipo[tipoRelatorio] || []).map(s => <Option key={s} value={s}>{s}</Option>)}
              </Select>
            </Col>
          )}
          <Col xs={24} sm={4}>
            <Button type="primary" icon={<SearchOutlined />} onClick={gerar} loading={loading} block>
              Gerar
            </Button>
          </Col>
        </Row>
      </Card>

      {dados.length > 0 && (
        <>
          {renderTotais()}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Space>
              <Button icon={<FilePdfOutlined />} danger onClick={exportarPDF}>PDF</Button>
              <Button icon={<FileExcelOutlined />} style={{ color: 'green', borderColor: 'green' }} onClick={exportarExcel}>Excel</Button>
            </Space>
          </div>
          <Table dataSource={dados} columns={getColunas()} rowKey="id" pagination={{ pageSize: 20 }} />
        </>
      )}
    </>
  );
};

export default Relatorios;