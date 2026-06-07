import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { listarProdutos } from '../services/produtosService';
import { listarMovimentacoes, movimentarEstoque } from '../services/estoqueService';

const { Option } = Select;

const Estoque = () => {
  const [produtos, setProdutos] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [form] = Form.useForm();

  const carregarProdutos = async () => {
    setLoading(true);
    try {
      const data = await listarProdutos();
      setProdutos(data);
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
      setModalAberto(false);
      form.resetFields();
      carregarProdutos();
      carregarMovimentacoes(produtoSelecionado.id);
    } catch (e) {
      message.error(e.response?.data?.mensagem || 'Erro ao movimentar estoque.');
    }
  };

  const colunasProdutos = [
    { title: 'Nome', dataIndex: 'nome', key: 'nome' },
    { title: 'Código', dataIndex: 'codigo', key: 'codigo' },
    { title: 'Estoque Atual', dataIndex: 'estoqueAtual', key: 'estoqueAtual' },
    { title: 'Estoque Mínimo', dataIndex: 'estoqueMinimo', key: 'estoqueMinimo',
      render: (min, record) => (
        <Tag color={record.estoqueAtual <= min ? 'red' : 'green'}>
          {min}
        </Tag>
      )
    },
    {
      title: 'Ações', key: 'acoes',
      render: (_, record) => (
        <Button onClick={() => selecionarProduto(record)}>Ver Movimentações</Button>
      )
    }
  ];

  const colunasMovimentacoes = [
    { title: 'Tipo', dataIndex: 'tipo', key: 'tipo',
      render: (tipo) => <Tag color={tipo === 'Entrada' ? 'green' : 'red'}>{tipo}</Tag>
    },
    { title: 'Quantidade', dataIndex: 'quantidade', key: 'quantidade' },
    { title: 'Observação', dataIndex: 'observacao', key: 'observacao' },
    { title: 'Data', dataIndex: 'criadoEm', key: 'criadoEm',
      render: (d) => new Date(d).toLocaleDateString('pt-BR')
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Estoque</h2>
        {produtoSelecionado && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalAberto(true)}>
            Nova Movimentação
          </Button>
        )}
      </div>

      <Table dataSource={produtos} columns={colunasProdutos} rowKey="id" loading={loading} />

      {produtoSelecionado && (
        <>
          <h3 style={{ marginTop: 24 }}>Movimentações — {produtoSelecionado.nome}</h3>
          <Table dataSource={movimentacoes} columns={colunasMovimentacoes} rowKey="id" />
        </>
      )}

      <Modal
        title="Nova Movimentação"
        open={modalAberto}
        onCancel={() => { setModalAberto(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" onFinish={movimentar}>
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
    </>
  );
};

export default Estoque;