import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Tag, Alert, Row, Col, Card, Tabs } from 'antd';
import { PlusOutlined, AuditOutlined } from '@ant-design/icons';
import { listarProdutos } from '../services/produtosService';
import { listarMovimentacoes, movimentarEstoque } from '../services/estoqueService';
import api from '../services/api';

const { Option } = Select;

const Estoque = () => {
  const [produtos, setProdutos] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [produtosBaixoEstoque, setProdutosBaixoEstoque] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalMovimentacao, setModalMovimentacao] = useState(false);
  const [modalInventario, setModalInventario] = useState(false);
  const [produtoInventario, setProdutoInventario] = useState(null);
  const [formMovimentacao] = Form.useForm();
  const [formInventario] = Form.useForm();

  const carregarProdutos = async () => {
    setLoading(true);
    try {
      const data = await listarProdutos();
      setProdutos(data);
      const baixo = data.filter(p => p.estoqueAtual <= p.estoqueMinimo);
      setProdutosBaixoEstoque(baixo);
    } catch {
      message.error('Erro ao carregar produtos.');
    } finally {
      setLoading(false);
    }
  };

  const carregarMovimentacoes = async (produtoId) => {
    try {
      const data = await listarMovimentacoes(produtoId);
      setMovimentacoes(data);
    } catch {
      message.error('Erro ao carregar movimentações.');
    }
  };

  useEffect(() => { carregarProdutos(); }, []);

  const selecionarProduto = (produto) => {
    setProdutoSelecionado(produto);
    carregarMovimentacoes(produto.id);
  };

  const movimentar = async (values) => {
    try {
      await movimentarEstoque({ ...values, produtoId: produtoSelecionado.id });
      message.success('Movimentação realizada com sucesso!');
      setModalMovimentacao(false);
      formMovimentacao.resetFields();
      carregarProdutos();
      carregarMovimentacoes(produtoSelecionado.id);
    } catch (e) {
      message.error(e.response?.data?.mensagem || 'Erro ao movimentar estoque.');
    }
  };

  const ajustarInventario = async (values) => {
    try {
      await api.post('/Estoque/inventario', {
        produtoId: produtoInventario.id,
        quantidadeReal: values.quantidadeReal,
        observacao: values.observacao
      });
      message.success('Inventário ajustado com sucesso!');
      setModalInventario(false);
      formInventario.resetFields();
      setProdutoInventario(null);
      carregarProdutos();
      if (produtoSelecionado?.id === produtoInventario.id) {
        carregarMovimentacoes(produtoInventario.id);
      }
    } catch (e) {
      message.error(e.response?.data?.mensagem || 'Erro ao ajustar inventário.');
    }
  };

  const colunasProdutos = [
    { title: 'Nome', dataIndex: 'nome', key: 'nome' },
    { title: 'Código', dataIndex: 'codigo', key: 'codigo' },
    { title: 'Categoria', dataIndex: 'categoria', key: 'categoria' },
    {
      title: 'Estoque Atual', dataIndex: 'estoqueAtual', key: 'estoqueAtual',
      render: (val, record) => (
        <Tag color={val <= record.estoqueMinimo ? 'red' : val <= record.estoqueMinimo * 1.5 ? 'orange' : 'green'}>
          {val}
        </Tag>
      )
    },
    { title: 'Mínimo', dataIndex: 'estoqueMinimo', key: 'estoqueMinimo' },
    { title: 'Unidade', dataIndex: 'unidade', key: 'unidade' },
    {
      title: 'Ações', key: 'acoes',
      render: (_, record) => (
        <Row gutter={8}>
          <Col>
            <Button size="small" onClick={() => selecionarProduto(record)}>Movimentações</Button>
          </Col>
          <Col>
            <Button size="small" icon={<AuditOutlined />} onClick={() => {
              setProdutoInventario(record);
              formInventario.setFieldsValue({ quantidadeReal: record.estoqueAtual });
              setModalInventario(true);
            }}>
              Inventário
            </Button>
          </Col>
        </Row>
      )
    }
  ];

  const colunasMovimentacoes = [
    {
      title: 'Tipo', dataIndex: 'tipo', key: 'tipo',
      render: (tipo) => <Tag color={tipo === 'Entrada' ? 'green' : 'red'}>{tipo}</Tag>
    },
    { title: 'Quantidade', dataIndex: 'quantidade', key: 'quantidade' },
    { title: 'Observação', dataIndex: 'observacao', key: 'observacao' },
    {
      title: 'Data', dataIndex: 'criadoEm', key: 'criadoEm',
      render: (d) => new Date(d).toLocaleDateString('pt-BR')
    },
  ];

  const tabItems = [
    {
      key: 'produtos',
      label: 'Todos os Produtos',
      children: (
        <>
          {produtosBaixoEstoque.length > 0 && (
            <Alert
              message={`⚠️ ${produtosBaixoEstoque.length} produto(s) com estoque abaixo do mínimo`}
              description={produtosBaixoEstoque.map(p => p.nome).join(', ')}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          <Table dataSource={produtos} columns={colunasProdutos} rowKey="id" loading={loading} />
        </>
      )
    },
    {
      key: 'baixo',
      label: `Estoque Baixo ${produtosBaixoEstoque.length > 0 ? `(${produtosBaixoEstoque.length})` : ''}`,
      children: (
        <Table
          dataSource={produtosBaixoEstoque}
          columns={colunasProdutos}
          rowKey="id"
          loading={loading}
        />
      )
    }
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Estoque</h2>
        {produtoSelecionado && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalMovimentacao(true)}>
            Nova Movimentação
          </Button>
        )}
      </div>

      <Tabs items={tabItems} />

      {produtoSelecionado && (
        <Card
          title={`Movimentações — ${produtoSelecionado.nome}`}
          style={{ marginTop: 24 }}
          extra={<Button size="small" onClick={() => setProdutoSelecionado(null)}>Fechar</Button>}
        >
          <Table dataSource={movimentacoes} columns={colunasMovimentacoes} rowKey="id" />
        </Card>
      )}

      {/* Modal Movimentação */}
      <Modal
        title={`Nova Movimentação — ${produtoSelecionado?.nome}`}
        open={modalMovimentacao}
        onCancel={() => { setModalMovimentacao(false); formMovimentacao.resetFields(); }}
        onOk={() => formMovimentacao.submit()}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form form={formMovimentacao} layout="vertical" onFinish={movimentar}>
          <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]}>
            <Select>
              <Option value="Entrada">Entrada</Option>
              <Option value="Saida">Saída</Option>
            </Select>
          </Form.Item>
          <Form.Item name="quantidade" label="Quantidade" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="observacao" label="Observação">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Inventário */}
      <Modal
        title={`Ajuste de Inventário — ${produtoInventario?.nome}`}
        open={modalInventario}
        onCancel={() => { setModalInventario(false); formInventario.resetFields(); setProdutoInventario(null); }}
        onOk={() => formInventario.submit()}
        okText="Ajustar"
        cancelText="Cancelar"
      >
        {produtoInventario && (
          <Alert
            message={`Estoque atual: ${produtoInventario.estoqueAtual} ${produtoInventario.unidade || 'un'}`}
            type="info"
            style={{ marginBottom: 16 }}
          />
        )}
        <Form form={formInventario} layout="vertical" onFinish={ajustarInventario}>
          <Form.Item name="quantidadeReal" label="Quantidade Real (contagem física)" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="observacao" label="Observação">
            <Input placeholder="Ex: Contagem física realizada em 08/06/2026" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Estoque;