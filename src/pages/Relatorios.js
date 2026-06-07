import { useState } from 'react';
import { Card, Button, DatePicker, Select, Row, Col, Table, message, Space } from 'antd';
import { FilePdfOutlined, FileExcelOutlined } from '@ant-design/icons';
import { listarPedidos } from '../services/pedidosService';
import { listarLancamentos } from '../services/financeiroService';
import { listarProdutos } from '../services/produtosService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const { RangePicker } = DatePicker;
const { Option } = Select;

const Relatorios = () => {
  const [tipoRelatorio, setTipoRelatorio] = useState('pedidos');
  const [periodo, setPeriodo] = useState(null);
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(false);

  const gerar = async () => {
    setLoading(true);
    try {
      let resultado = [];

      if (tipoRelatorio === 'pedidos') {
        const pedidos = await listarPedidos();
        resultado = pedidos.filter(p => {
          if (!periodo) return true;
          const data = new Date(p.criadoEm);
          return data >= periodo[0].toDate() && data <= periodo[1].toDate();
        });
      } else if (tipoRelatorio === 'financeiro') {
        const lancamentos = await listarLancamentos();
        resultado = lancamentos.filter(l => {
          if (!periodo) return true;
          const data = new Date(l.dataVencimento);
          return data >= periodo[0].toDate() && data <= periodo[1].toDate();
        });
      } else if (tipoRelatorio === 'estoque') {
        resultado = await listarProdutos();
      }

      setDados(resultado);
      if (resultado.length === 0) message.warning('Nenhum dado encontrado para o período.');
    } catch {
      message.error('Erro ao gerar relatório.');
    } finally {
      setLoading(false);
    }
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.text(`Relatório de ${tipoRelatorio.charAt(0).toUpperCase() + tipoRelatorio.slice(1)}`, 14, 16);

    const colunas = getColunas().map(c => c.title);
    const linhas = dados.map(d => getColunas().map(c => {
      const val = c.dataIndex?.split ? d[c.dataIndex] : '';
      return c.render ? c.renderText?.(val, d) ?? val : val ?? '';
    }));

    autoTable(doc, { head: [colunas], body: linhas, startY: 22 });
    doc.save(`relatorio_${tipoRelatorio}.pdf`);
  };

  const exportarExcel = () => {
    const linhas = dados.map(d => {
      const obj = {};
      getColunas().forEach(c => {
        obj[c.title] = c.dataIndex ? d[c.dataIndex] : '';
      });
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(linhas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf]), `relatorio_${tipoRelatorio}.xlsx`);
  };

  const getColunas = () => {
    if (tipoRelatorio === 'pedidos') return [
      { title: '#', dataIndex: 'id' },
      { title: 'Cliente', dataIndex: 'pessoaNome', render: (_, r) => r.pessoa?.nome },
      { title: 'Status', dataIndex: 'status' },
      { title: 'Total', dataIndex: 'valorTotal', render: (v) => `R$ ${v?.toFixed(2)}` },
      { title: 'Data', dataIndex: 'criadoEm', render: (d) => new Date(d).toLocaleDateString('pt-BR') },
    ];
    if (tipoRelatorio === 'financeiro') return [
      { title: 'Descrição', dataIndex: 'descricao' },
      { title: 'Tipo', dataIndex: 'tipo' },
      { title: 'Valor', dataIndex: 'valor', render: (v) => `R$ ${v?.toFixed(2)}` },
      { title: 'Status', dataIndex: 'status' },
      { title: 'Vencimento', dataIndex: 'dataVencimento', render: (d) => new Date(d).toLocaleDateString('pt-BR') },
    ];
    if (tipoRelatorio === 'estoque') return [
      { title: 'Produto', dataIndex: 'nome' },
      { title: 'Código', dataIndex: 'codigo' },
      { title: 'Estoque Atual', dataIndex: 'estoqueAtual' },
      { title: 'Estoque Mínimo', dataIndex: 'estoqueMinimo' },
      { title: 'Preço Venda', dataIndex: 'precoVenda', render: (v) => `R$ ${v?.toFixed(2)}` },
    ];
    return [];
  };

  return (
    <>
      <h2>Relatórios</h2>
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={8}>
            <Select
              value={tipoRelatorio}
              onChange={setTipoRelatorio}
              style={{ width: '100%' }}
            >
              <Option value="pedidos">Pedidos</Option>
              <Option value="financeiro">Financeiro</Option>
              <Option value="estoque">Estoque</Option>
            </Select>
          </Col>
          {tipoRelatorio !== 'estoque' && (
            <Col xs={24} sm={10}>
              <RangePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                onChange={setPeriodo}
              />
            </Col>
          )}
          <Col xs={24} sm={6}>
            <Button type="primary" onClick={gerar} loading={loading} block>
              Gerar Relatório
            </Button>
          </Col>
        </Row>
      </Card>

      {dados.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, gap: 8 }}>
            <Space>
              <Button icon={<FilePdfOutlined />} danger onClick={exportarPDF}>
                Exportar PDF
              </Button>
              <Button icon={<FileExcelOutlined />} style={{ color: 'green', borderColor: 'green' }} onClick={exportarExcel}>
                Exportar Excel
              </Button>
            </Space>
          </div>
          <Table
            dataSource={dados}
            columns={getColunas()}
            rowKey="id"
            pagination={{ pageSize: 20 }}
          />
        </>
      )}
    </>
  );
};

export default Relatorios;