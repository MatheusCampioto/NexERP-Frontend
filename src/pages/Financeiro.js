import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, message, Tag, Space, Tabs } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { listarContasAPagar, listarContasAReceber, criarLancamento, baixarLancamento, cancelarLancamento } from '../services/financeiroService';
import { listarPessoas } from '../services/pessoasService';
import dayjs from 'dayjs';

const { Option } = Select;
const statusCor = { Aberto: 'blue', Pago: 'green', Cancelado: 'red' };

const TabelaLancamentos = ({ dados, loading, onBaixar, onCancelar }) => {
  const colunas = [
    { title: 'Descrição', dataIndex: 'descricao', key: 'descricao' },
    { title: 'Valor', dataIndex: 'valor', key: 'valor', render: (v) => `R$ ${v?.toFixed(2)}` },
    { title: 'Vencimento', dataIndex: 'dataVencimento', key: 'dataVencimento',
      render: (d) => new Date(d).toLocaleDateString('pt-BR')
    },
    { title: 'Status', dataIndex: 'status', key: 'status',
      render: (s) => <Tag color={statusCor[s]}>{s}</Tag>
    },
    { title: 'Categoria', dataIndex: 'categoria', key: 'categoria' },
    {
      title: 'Ações', key: 'acoes',
      render: (_, record) => (
        <Space>
          {record.status === 'Aberto' && (
            <>
              <Button type="primary" size="small" onClick={() => onBaixar(record.id)}>Baixar</Button>
              <Button danger size="small" onClick={() => onCancelar(record.id)}>Cancelar</Button>
            </>
          )}
        </Space>
      )
    }
  ];
  return <Table dataSource={dados} columns={colunas} rowKey="id" loading={loading} />;
};

const Financeiro = () => {
  const [pagar, setPagar] = useState([]);
  const [receber, setReceber] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [tipoModal, setTipoModal] = useState('Receita');
  const [form] = Form.useForm();

  const carregar = async () => {
    setLoading(true);
    try {
      const [p, r, pe] = await Promise.all([listarContasAPagar(), listarContasAReceber(), listarPessoas()]);
      setPagar(p);
      setReceber(r);
      setPessoas(pe);
    } catch {
      message.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const abrirModal = (tipo) => {
    setTipoModal(tipo);
    setModalAberto(true);
  };

  const salvar = async (values) => {
    try {
      await criarLancamento({
        ...values,
        tipo: tipoModal,
        dataVencimento: values.dataVencimento.toISOString(),
      });
      message.success('Lançamento criado com sucesso!');
      setModalAberto(false);
      form.resetFields();
      carregar();
    } catch {
      message.error('Erro ao criar lançamento.');
    }
  };

  const baixar = async (id) => {
    try {
      await baixarLancamento(id);
      message.success('Lançamento baixado!');
      carregar();
    } catch (e) {
      message.error(e.response?.data?.mensagem || 'Erro ao baixar.');
    }
  };

  const cancelar = async (id) => {
    try {
      await cancelarLancamento(id);
      message.success('Lançamento cancelado!');
      carregar();
    } catch (e) {
      message.error(e.response?.data?.mensagem || 'Erro ao cancelar.');
    }
  };

  const tabItems = [
    {
      key: 'receber',
      label: 'Contas a Receber',
      children: (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => abrirModal('Receita')}>
              Nova Receita
            </Button>
          </div>
          <TabelaLancamentos dados={receber} loading={loading} onBaixar={baixar} onCancelar={cancelar} />
        </>
      )
    },
    {
      key: 'pagar',
      label: 'Contas a Pagar',
      children: (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => abrirModal('Despesa')}>
              Nova Despesa
            </Button>
          </div>
          <TabelaLancamentos dados={pagar} loading={loading} onBaixar={baixar} onCancelar={cancelar} />
        </>
      )
    }
  ];

  return (
    <>
      <h2>Financeiro</h2>
      <Tabs items={tabItems} />
      <Modal
        title={tipoModal === 'Receita' ? 'Nova Receita' : 'Nova Despesa'}
        open={modalAberto}
        onCancel={() => { setModalAberto(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" onFinish={salvar}>
          <Form.Item name="descricao" label="Descrição" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="valor" label="Valor" rules={[{ required: true }]}>
            <InputNumber min={0} precision={2} prefix="R$" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="dataVencimento" label="Data de Vencimento" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="categoria" label="Categoria">
            <Input />
          </Form.Item>
          <Form.Item name="pessoaId" label="Pessoa">
            <Select allowClear placeholder="Selecione" showSearch optionFilterProp="children">
              {pessoas.map(p => <Option key={p.id} value={p.id}>{p.nome}</Option>)}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Financeiro;