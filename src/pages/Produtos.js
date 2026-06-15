import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Popconfirm, Space, Tag, Tabs, Row, Col, Switch, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { listarProdutos, criarProduto, atualizarProduto, desativarProduto } from '../services/produtosService';
import { listarCategorias, criarCategoria, desativarCategoria } from '../services/categoriasService';
import { listarPessoas } from '../services/pessoasService';

const { Option } = Select;
const { TextArea } = Input;

const origens = [
  { value: '0', label: '0 - Nacional' },
  { value: '1', label: '1 - Estrangeira - Importação direta' },
  { value: '2', label: '2 - Estrangeira - Adquirida no mercado interno' },
  { value: '3', label: '3 - Nacional - mercadoria ou bem com Conteúdo de Importação superior a 40%' },
  { value: '4', label: '4 - Nacional - produção em conformidade com os processos produtivos básicos' },
  { value: '5', label: '5 - Nacional - mercadoria ou bem com Conteúdo de Importação inferior ou igual a 40%' },
  { value: '6', label: '6 - Estrangeira - Importação direta, sem similar nacional' },
  { value: '7', label: '7 - Estrangeira - Adquirida no mercado interno, sem similar nacional' },
  { value: '8', label: '8 - Nacional - mercadoria ou bem com Conteúdo de Importação superior a 70%' },
];

const Produtos = () => {
  const [produtos, setProdutos] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalProduto, setModalProduto] = useState(false);
  const [modalCategoria, setModalCategoria] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState(null);
  const [controlaValidade, setControlaValidade] = useState(false);
  const [formProduto] = Form.useForm();
  const [formCategoria] = Form.useForm();

  const carregar = async () => {
    setLoading(true);
    try {
      const [p, c, pessoas] = await Promise.all([listarProdutos(), listarCategorias(), listarPessoas()]);
      setProdutos(p);
      setFiltrados(p);
      setCategorias(c);
      setFornecedores(pessoas.filter(p => p.tipo === 'Fornecedor'));
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
    if (produto) {
      setControlaValidade(produto.controlaValidade || false);
      formProduto.setFieldsValue({ ...produto });
    } else {
      setControlaValidade(false);
      formProduto.resetFields();
      formProduto.setFieldsValue({ controlaValidade: false, estoqueMinimo: 0 });
    }
    setModalProduto(true);
  };

  const salvarProduto = async (values) => {
    try {
      const dados = { ...values, controlaValidade: controlaValidade };
      if (produtoEditando) {
        await atualizarProduto(produtoEditando.id, dados);
        message.success('Produto atualizado!');
      } else {
        await criarProduto(dados);
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
    { title: 'NCM', dataIndex: 'ncm', key: 'ncm' },
    {
      title: 'Categoria', key: 'categoria',
      render: (_, r) => r.categoria ? <Tag color="blue">{r.categoria.nome}</Tag> : '-'
    },
    { title: 'Preço Venda', dataIndex: 'precoVenda', key: 'precoVenda', render: (v) => `R$ ${v?.toFixed(2)}` },
    {
      title: 'Margem', key: 'margem',
      render: (_, r) => r.precoCusto > 0
        ? <Tag color={((r.precoVenda - r.precoCusto) / r.precoCusto * 100) >= 0 ? 'green' : 'red'}>
            {((r.precoVenda - r.precoCusto) / r.precoCusto * 100).toFixed(1)}%
          </Tag>
        : '-'
    },
    {
      title: 'Estoque', dataIndex: 'estoqueAtual', key: 'estoqueAtual',
      render: (v, r) => <Tag color={v <= r.estoqueMinimo ? 'red' : 'green'}>{v}</Tag>
    },
    {
      title: 'Ações', key: 'acoes',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => abrirModal(record)} />
          <Popconfirm title="Desativar produto?" onConfirm={() => desativar(record.id)} okText="Sim" cancelText="Não">
            <Button icon={<DeleteOutlined />} size="small" danger />
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
              <Select placeholder="Filtrar por categoria" style={{ width: '100%' }} allowClear onChange={setCategoriaFiltro}>
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

      {/* Modal Produto */}
      <Modal
        title={produtoEditando ? 'Editar Produto' : 'Novo Produto'}
        open={modalProduto}
        onCancel={() => { setModalProduto(false); formProduto.resetFields(); }}
        onOk={() => formProduto.submit()}
        okText="Salvar"
        cancelText="Cancelar"
        width={800}
      >
        <Form form={formProduto} layout="vertical" onFinish={salvarProduto}>
          <Tabs items={[
            {
              key: 'geral',
              label: 'Geral',
              children: (
                <>
                  <Row gutter={16}>
                    <Col span={14}>
                      <Form.Item name="nome" label="Nome" rules={[{ required: true }]}>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item name="unidade" label="Unidade">
                        <Select allowClear placeholder="Selecione">
                          <Option value="UN">UN</Option>
                          <Option value="KG">KG</Option>
                          <Option value="L">L</Option>
                          <Option value="CX">CX</Option>
                          <Option value="MT">MT</Option>
                          <Option value="PC">PC</Option>
                          <Option value="M2">M²</Option>
                          <Option value="M3">M³</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item name="categoriaId" label="Categoria">
                        <Select allowClear placeholder="Selecione">
                          {categorias.map(c => <Option key={c.id} value={c.id}>{c.nome}</Option>)}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
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
                  <Form.Item name="descricao" label="Descrição">
                    <TextArea rows={2} />
                  </Form.Item>
                  <Form.Item name="fornecedorId" label="Fornecedor Padrão">
                    <Select allowClear showSearch optionFilterProp="children" placeholder="Selecione">
                      {fornecedores.map(f => <Option key={f.id} value={f.id}>{f.razaoSocial || f.nome}</Option>)}
                    </Select>
                  </Form.Item>
                </>
              )
            },
            {
              key: 'precificacao',
              label: 'Precificação',
              children: (
                <>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item name="precoCusto" label="Preço de Custo">
                        <InputNumber min={0} precision={2} prefix="R$" style={{ width: '100%' }}
                          onChange={() => {
                            const custo = formProduto.getFieldValue('precoCusto') || 0;
                            const venda = formProduto.getFieldValue('precoVenda') || 0;
                            if (custo > 0) {
                              formProduto.setFieldsValue({ margemLucro: ((venda - custo) / custo * 100).toFixed(2) });
                            }
                          }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="precoVenda" label="Preço de Venda" rules={[{ required: true }]}>
                        <InputNumber min={0} precision={2} prefix="R$" style={{ width: '100%' }}
                          onChange={() => {
                            const custo = formProduto.getFieldValue('precoCusto') || 0;
                            const venda = formProduto.getFieldValue('precoVenda') || 0;
                            if (custo > 0) {
                              formProduto.setFieldsValue({ margemLucro: ((venda - custo) / custo * 100).toFixed(2) });
                            }
                          }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="margemLucro" label="Margem de Lucro (%)">
                        <InputNumber precision={2} suffix="%" style={{ width: '100%' }} disabled />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="precoMinimo" label="Preço Mínimo de Venda">
                        <InputNumber min={0} precision={2} prefix="R$" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              )
            },
            {
              key: 'fiscal',
              label: 'Fiscal',
              children: (
                <>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item name="ncm" label="NCM">
                        <Input placeholder="0000.00.00" maxLength={10} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="cest" label="CEST">
                        <Input placeholder="00.000.00" maxLength={9} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="cfop" label="CFOP">
                        <Input placeholder="0000" maxLength={5} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="origemMercadoria" label="Origem da Mercadoria">
                    <Select allowClear placeholder="Selecione">
                      {origens.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
                    </Select>
                  </Form.Item>
                  <Divider>Simples Nacional</Divider>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="csosn" label="CSOSN">
                        <Select allowClear placeholder="Selecione">
                          <Option value="101">101 - Tributada pelo Simples Nacional com permissão de crédito</Option>
                          <Option value="102">102 - Tributada pelo Simples Nacional sem permissão de crédito</Option>
                          <Option value="103">103 - Isenção do ICMS no Simples Nacional</Option>
                          <Option value="300">300 - Imune</Option>
                          <Option value="400">400 - Não tributada pelo Simples Nacional</Option>
                          <Option value="500">500 - ICMS cobrado anteriormente por ST</Option>
                          <Option value="900">900 - Outros</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="aliquotaICMS" label="Alíquota ICMS (%)">
                        <InputNumber min={0} max={100} precision={2} suffix="%" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Divider>Lucro Presumido / Real</Divider>
                  <Row gutter={16}>
                    <Col span={6}>
                      <Form.Item name="cst_ICMS" label="CST ICMS">
                        <Input maxLength={3} placeholder="000" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="cst_PIS" label="CST PIS">
                        <Input maxLength={3} placeholder="000" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="cst_COFINS" label="CST COFINS">
                        <Input maxLength={3} placeholder="000" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="aliquotaIPI" label="IPI (%)">
                        <InputNumber min={0} max={100} precision={2} suffix="%" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="aliquotaPIS" label="PIS (%)">
                        <InputNumber min={0} max={100} precision={2} suffix="%" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="aliquotaCOFINS" label="COFINS (%)">
                        <InputNumber min={0} max={100} precision={2} suffix="%" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              )
            },
            {
              key: 'estoque',
              label: 'Estoque',
              children: (
                <>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item name="estoqueMinimo" label="Estoque Mínimo">
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="estoqueMaximo" label="Estoque Máximo">
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="localizacaoEstoque" label="Localização">
                        <Input placeholder="Ex: A1-P2-C3" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item label="Controla Validade">
                        <Switch
                          checked={controlaValidade}
                          onChange={v => setControlaValidade(v)}
                          checkedChildren="Sim"
                          unCheckedChildren="Não"
                        />
                      </Form.Item>
                    </Col>
                    {controlaValidade && (
                      <Col span={8}>
                        <Form.Item name="diasValidade" label="Dias de Validade">
                          <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                    )}
                  </Row>
                </>
              )
            },
            {
              key: 'dimensoes',
              label: 'Dimensões',
              children: (
                <>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="pesoBruto" label="Peso Bruto (kg)">
                        <InputNumber min={0} precision={4} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="pesoLiquido" label="Peso Líquido (kg)">
                        <InputNumber min={0} precision={4} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item name="altura" label="Altura (cm)">
                        <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="largura" label="Largura (cm)">
                        <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="comprimento" label="Comprimento (cm)">
                        <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              )
            }
          ]} />
        </Form>
      </Modal>

      {/* Modal Categoria */}
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