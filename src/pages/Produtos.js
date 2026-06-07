import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message, Popconfirm, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { listarProdutos, criarProduto, atualizarProduto, desativarProduto } from '../services/produtosService';

const Produtos = () => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [form] = Form.useForm();

  const carregar = async () => {
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

  useEffect(() => { carregar(); }, []);

  const abrirModal = (produto = null) => {
    setProdutoEditando(produto);
    form.setFieldsValue(produto || {
      nome: '', descricao: '', codigo: '',
      precoVenda: 0, precoCusto: 0,
      unidade: '', categoria: '', estoqueMinimo: 0
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setProdutoEditando(null);
    form.resetFields();
  };

  const salvar = async (values) => {
    try {
      if (produtoEditando) {
        await atualizarProduto(produtoEditando.id, values);
        message.success('Produto atualizado com sucesso!');
      } else {
        await criarProduto(values);
        message.success('Produto criado com sucesso!');
      }
      fecharModal();
      carregar();
    } catch {
      message.error('Erro ao salvar produto.');
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
    { title: 'Categoria', dataIndex: 'categoria', key: 'categoria' },
    { title: 'Preço Venda', dataIndex: 'precoVenda', key: 'precoVenda', render: (v) => `R$ ${v?.toFixed(2)}` },
    { title: 'Estoque Atual', dataIndex: 'estoqueAtual', key: 'estoqueAtual' },
    { title: 'Estoque Mínimo', dataIndex: 'estoqueMinimo', key: 'estoqueMinimo' },
    {
      title: 'Ações', key: 'acoes',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => abrirModal(record)} />
          <Popconfirm title="Desativar produto?" onConfirm={() => desativar(record.id)}>
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
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
      <Table dataSource={produtos} columns={colunas} rowKey="id" loading={loading} />
      <Modal
        title={produtoEditando ? 'Editar Produto' : 'Novo Produto'}
        open={modalAberto}
        onCancel={fecharModal}
        onOk={() => form.submit()}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" onFinish={salvar}>
          <Form.Item name="nome" label="Nome" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="codigo" label="Código">
            <Input />
          </Form.Item>
          <Form.Item name="descricao" label="Descrição">
            <Input />
          </Form.Item>
          <Form.Item name="categoria" label="Categoria">
            <Input />
          </Form.Item>
          <Form.Item name="unidade" label="Unidade">
            <Input placeholder="UN, KG, L, CX" />
          </Form.Item>
          <Form.Item name="precoVenda" label="Preço de Venda" rules={[{ required: true }]}>
            <InputNumber min={0} precision={2} prefix="R$" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="precoCusto" label="Preço de Custo">
            <InputNumber min={0} precision={2} prefix="R$" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="estoqueMinimo" label="Estoque Mínimo">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Produtos;