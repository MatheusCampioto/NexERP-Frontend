import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, Input, InputNumber, message, Tag, Space } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { listarPedidos, criarPedido, confirmarPedido, cancelarPedido } from '../services/pedidosService';
import { listarPessoas } from '../services/pessoasService';
import { listarProdutos } from '../services/produtosService';

const { Option } = Select;

const statusCor = { Aberto: 'blue', Confirmado: 'green', Cancelado: 'red' };

const Pedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [form] = Form.useForm();

  const carregar = async () => {
    setLoading(true);
    try {
      const [p, pe, pr] = await Promise.all([listarPedidos(), listarPessoas(), listarProdutos()]);
      setPedidos(p);
      setPessoas(pe);
      setProdutos(pr);
    } catch {
      message.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const salvar = async (values) => {
    try {
      await criarPedido(values);
      message.success('Pedido criado com sucesso!');
      setModalAberto(false);
      form.resetFields();
      carregar();
    } catch (e) {
      message.error(e.response?.data?.mensagem || 'Erro ao criar pedido.');
    }
  };

  const confirmar = async (id) => {
    try {
      await confirmarPedido(id);
      message.success('Pedido confirmado!');
      carregar();
    } catch (e) {
      message.error(e.response?.data?.mensagem || 'Erro ao confirmar pedido.');
    }
  };

  const cancelar = async (id) => {
    try {
      await cancelarPedido(id);
      message.success('Pedido cancelado!');
      carregar();
    } catch (e) {
      message.error(e.response?.data?.mensagem || 'Erro ao cancelar pedido.');
    }
  };

  const colunas = [
    { title: '#', dataIndex: 'id', key: 'id' },
    { title: 'Cliente', dataIndex: ['pessoa', 'nome'], key: 'pessoa' },
    { title: 'Status', dataIndex: 'status', key: 'status',
      render: (s) => <Tag color={statusCor[s]}>{s}</Tag>
    },
    { title: 'Total', dataIndex: 'valorTotal', key: 'valorTotal',
      render: (v) => `R$ ${v?.toFixed(2)}`
    },
    { title: 'Data', dataIndex: 'criadoEm', key: 'criadoEm',
      render: (d) => new Date(d).toLocaleDateString('pt-BR')
    },
    {
      title: 'Ações', key: 'acoes',
      render: (_, record) => (
        <Space>
          {record.status === 'Aberto' && (
            <>
              <Button type="primary" size="small" onClick={() => confirmar(record.id)}>Confirmar</Button>
              <Button danger size="small" onClick={() => cancelar(record.id)}>Cancelar</Button>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Pedidos</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalAberto(true)}>
          Novo Pedido
        </Button>
      </div>
      <Table dataSource={pedidos} columns={colunas} rowKey="id" loading={loading} />
      <Modal
        title="Novo Pedido"
        open={modalAberto}
        onCancel={() => { setModalAberto(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText="Salvar"
        cancelText="Cancelar"
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={salvar}>
          <Form.Item name="pessoaId" label="Cliente" rules={[{ required: true }]}>
            <Select placeholder="Selecione o cliente" showSearch optionFilterProp="children">
              {pessoas.map(p => <Option key={p.id} value={p.id}>{p.nome}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="observacao" label="Observação">
            <Input />
          </Form.Item>
          <Form.List name="itens" rules={[{ validator: async (_, itens) => { if (!itens || itens.length < 1) return Promise.reject('Adicione pelo menos um item.'); } }]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name }) => (
                  <Space key={key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                    <Form.Item name={[name, 'produtoId']} rules={[{ required: true }]}>
                      <Select placeholder="Produto" style={{ width: 250 }} showSearch optionFilterProp="children">
                        {produtos.map(p => <Option key={p.id} value={p.id}>{p.nome}</Option>)}
                      </Select>
                    </Form.Item>
                    <Form.Item name={[name, 'quantidade']} rules={[{ required: true }]}>
                      <InputNumber min={1} placeholder="Qtd" />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                  Adicionar Item
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </>
  );
};

export default Pedidos;