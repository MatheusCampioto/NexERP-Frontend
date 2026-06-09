import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Popconfirm, Space, Tag, Tabs, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { listarProdutos, criarProduto, atualizarProduto, desativarProduto } from '../services/produtosService';
import { listarCategorias, criarCategoria, desativarCategoria } from '../services/categoriasService';

const { Option } = Select;

const Produtos = () => {
  const [produtos, setProdutos] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalProduto, setModalProduto] = useState(false);
  const [modalCategoria, setModalCategoria] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState(null);
  const [formProduto] = Form.useForm();
  const [formCategoria] = Form.useForm();

  const carregar = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([listarProdutos(), listarCategorias()]);
      setProdutos(p);
      setFiltrados(p);
      setCategorias(c);
    } catch {
      message.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  useEffect(() => {
    let resultado = produtos;
    if (busca) {
      resultado = resultado.filter(p =>
        p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        p.codigo?.toLowerCase().includes(busca.toLowerCase()) ||
        p.codigoBarras?.includes(busca)
      );
    }
    if (categoriaFiltro) {
      resultado = resultado.filter(p => p.categoriaId === categoriaFiltro);
    }
    setFiltrados(resultado);
  }, [busca, categoriaFiltro, produtos]);

  const abrirModal = (produto = null) => {
    setProdutoEditando(produto);
    formProduto.setFieldsValue(produto ? {
      nome: produto.nome,
      descricao: produto.descricao,
      codigo: produto.codigo,
      codigoBarras: produto.codigoBarras,
      precoVenda: produto.precoVenda,
      precoCusto: produto.precoCusto,
      unidade: produto.unidade,
      categoriaId: produto.categoriaId,
      estoqueMinimo: produto.estoqueMinimo,
    } : {
      nome: '', descricao: '', codigo: '', codigoBarras: '',
      precoVenda: 0, precoCusto: 0, unidade: '', categoriaId: null, estoqueMinimo: 0
    });
    setModalProduto(true);
  };

  const salvarProduto = async (values) => {
    try {
      if (produtoEditando) {
        await atualizarProduto(produtoEditando.id, values);
        message.success('Produto atualizado!');
      } else {
        await criarProduto(values);
        message.success('Produto criado!');
      }
      setModalProduto(false);
      formProduto.resetFields();
      carregar();
    } catch (e) {
      message.error(e.response?.data?.mensagem || 'Erro ao salvar produto.');
    }
  };

  const salvarCategoria = async (values) => {
    try {
      await criarCategoria(values);
      message.success('Categoria criada!');
      setModalCategoria(false);
      formCategoria.resetFields();
      carregar();
    } catch {
      message.error('Erro ao criar categoria.');
    }
  };

  const desativar = async (id) => {
    try {
      await desativarProduto(id);
      message.success('Produto desativado!');
      carregar();
    } catch {
      message.error('Erro ao desativar produto.');
    }
  };

  const colunas = [
    { title: 'Nome', dataIndex: 'nome', key: 'nome' },
    { title: 'Código', dataIndex: 'codigo', key: 'codigo' },
    { title: 'Cód. Barras', dataIndex: 'codigoBarras', key: 'codigoBarras' },
    {
      title: 'Categoria', key: 'categoria',
      render: (_, r) => r.categoria ? <Tag color="blue">{r.categoria.nome}</Tag> : '-'
    },
    { title: 'Preço Venda', dataIndex: 'precoVenda', key: 'precoVenda', render: (v) => `R$ ${v?.toFixed(2)}` },
    {
      title: 'Estoque', dataIndex: 'estoqueAtual', key: 'estoqueAtual',
      render: (v, r) => <Tag color={v <= r.estoqueMinimo ? 'red' : 'green'}>{v}</Tag>
    },
    {
      title: 'Ações', key: 'acoes',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => abrirModal(record)} />
          <Popconfirm title="Desativar produto?" onConfirm={() => desativar(record.id)} okText="Sim" cancelText="Não">
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const colunasCategoria = [
    { title: 'Nome', dataIndex: 'nome', key: 'nome' },
    { title: 'Descrição', dataIndex: 'descricao', key: 'descricao' },
    {
      title: 'Ações', key: 'acoes',
      render: (_, record) => (
        <Popconfirm title="Desativar categoria?" onConfirm={() => desativarCategoria(record.id).then(carregar)} okText="Sim" cancelText="Não">
          <Button icon={<DeleteOutlined />} danger size="small" />
        </Popconfirm>
      )
    }
  ];

  const tabItems = [
    {
      key: 'produtos',
      label: 'Produtos',
      children: (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={14}>
              <Input
                placeholder="Buscar por nome, código ou código de barras..."
                prefix={<SearchOutlined />}
                value={busca}
                onChange={e => setBusca(e.target.value)}
                allowClear
              />
            </Col>
            <Col span={10}>
              <Select
                placeholder="Filtrar por categoria"
                style={{ width: '100%' }}
                allowClear
                onChange={setCategoriaFiltro}
              >
                {categorias.map(c => <Option key={c.id} value={c.id}>{c.nome}</Option>)}
              </Select>
            </Col>
          </Row>
          <Table dataSource={filtrados} columns={colunas} rowKey="id" loading={loading} />
        </>
      )
    },
    {
      key: 'categorias',
      label: 'Categorias',
      children: (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalCategoria(true)}>
              Nova Categoria
            </Button>
          </div>
          <Table dataSource={categorias} columns={colunasCategoria} rowKey="id" />
        </>
      )
    }
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Produtos</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => abrirModal()}>
          Novo Produto
        </Button>
      </div>

      <Tabs items={tabItems} />

      <Modal
        title={produtoEditando ? 'Editar Produto' : 'Novo Produto'}
        open={modalProduto}
        onCancel={() => { setModalProduto(false); formProduto.resetFields(); }}
        onOk={() => formProduto.submit()}
        okText="Salvar"
        cancelText="Cancelar"
        width={650}
      >
        <Form form={formProduto} layout="vertical" onFinish={salvarProduto}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="nome" label="Nome" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unidade" label="Unidade">
                <Select allowClear placeholder="Selecione">
                  <Option value="UN">UN</Option>
                  <Option value="KG">KG</Option>
                  <Option value="L">L</Option>
                  <Option value="CX">CX</Option>
                  <Option value="MT">MT</Option>
                  <Option value="PC">PC</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="descricao" label="Descrição">
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="codigo" label="Código Interno">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="codigoBarras" label="Código de Barras">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="precoVenda" label="Preço de Venda" rules={[{ required: true }]}>
                <InputNumber min={0} precision={2} prefix="R$" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="precoCusto" label="Preço de Custo">
                <InputNumber min={0} precision={2} prefix="R$" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="categoriaId" label="Categoria">
                <Select allowClear placeholder="Selecione">
                  {categorias.map(c => <Option key={c.id} value={c.id}>{c.nome}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="estoqueMinimo" label="Estoque Mínimo">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="Nova Categoria"
        open={modalCategoria}
        onCancel={() => { setModalCategoria(false); formCategoria.resetFields(); }}
        onOk={() => formCategoria.submit()}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form form={formCategoria} layout="vertical" onFinish={salvarCategoria}>
          <Form.Item name="nome" label="Nome" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="descricao" label="Descrição">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Produtos;