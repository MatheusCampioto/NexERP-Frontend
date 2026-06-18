import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, message, Tag, Space, Tabs, Card, Row, Col, Statistic, Divider } from 'antd';
import { PlusOutlined, BankOutlined } from '@ant-design/icons';
import { listarContasAPagar, listarContasAReceber, criarLancamento, baixarLancamento, cancelarLancamento } from '../services/financeiroService';
import { listarContasBancarias, criarContaBancaria } from '../services/contasBancariasService';
import { listarPessoas } from '../services/pessoasService';

const { Option } = Select;
const { RangePicker } = DatePicker;
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
    { title: 'Forma Pgto', dataIndex: 'formaPagamento', key: 'formaPagamento' },
    { title: 'Parcela', key: 'parcela',
      render: (_, r) => r.totalParcelas > 1 ? `${r.numeroParcela}/${r.totalParcelas}` : '-'
    },
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
  return <Table dataSource={dados} columns={colunas} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />;
};

const Financeiro = () => {
  const [pagar, setPagar] = useState([]);
  const [receber, setReceber] = useState([]);
  const [contas, setContas] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [fluxo, setFluxo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalLancamento, setModalLancamento] = useState(false);
  const [modalConta, setModalConta] = useState(false);
  const [tipoModal, setTipoModal] = useState('Receita');
  const [formLancamento] = Form.useForm();
  const [formConta] = Form.useForm();

  const carregar = async () => {
    setLoading(true);
    try {
      const [p, r, c, pe] = await Promise.all([
        listarContasAPagar(),
        listarContasAReceber(),
        listarContasBancarias(),
        listarPessoas()
      ]);
      setPagar(p);
      setReceber(r);
      setContas(c);
      setPessoas(pe);
    } catch {
      message.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const abrirModalLancamento = (tipo) => {
    setTipoModal(tipo);
    setModalLancamento(true);
  };

  const salvarLancamento = async (values) => {
    try {
      await criarLancamento({
        ...values,
        tipo: tipoModal,
        dataVencimento: values.dataVencimento.toISOString(),
        totalParcelas: values.totalParcelas || 1,
      });
      message.success('Lançamento criado com sucesso!');
      setModalLancamento(false);
      formLancamento.resetFields();
      carregar();
    } catch {
      message.error('Erro ao criar lançamento.');
    }
  };

  const salvarConta = async (values) => {
    try {
      await criarContaBancaria(values);
      message.success('Conta criada com sucesso!');
      setModalConta(false);
      formConta.resetFields();
      carregar();
    } catch {
      message.error('Erro ao criar conta.');
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

  const gerarFluxo = async (datas) => {
    if (!datas) return;
    try {
      const inicio = datas[0].toISOString();
      const fim = datas[1].toISOString();
      const response = await fetch(
        `http://localhost:5132/api/Financeiro/fluxo-caixa?inicio=${inicio}&fim=${fim}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = await response.json();
      setFluxo(data);
    } catch {
      message.error('Erro ao gerar fluxo de caixa.');
    }
  };

  const totalReceber = receber.filter(r => r.status === 'Aberto').reduce((acc, r) => acc + r.valor, 0);
  const totalPagar = pagar.filter(p => p.status === 'Aberto').reduce((acc, p) => acc + p.valor, 0);
  const totalContas = contas.reduce((acc, c) => acc + c.saldoAtual, 0);

  const tabItems = [
    {
      key: 'receber',
      label: 'Contas a Receber',
      children: (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => abrirModalLancamento('Receita')}>
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
            <Button type="primary" icon={<PlusOutlined />} onClick={() => abrirModalLancamento('Despesa')}>
              Nova Despesa
            </Button>
          </div>
          <TabelaLancamentos dados={pagar} loading={loading} onBaixar={baixar} onCancelar={cancelar} />
        </>
      )
    },
    {
      key: 'contas',
      label: 'Contas Bancárias',
      children: (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button type="primary" icon={<BankOutlined />} onClick={() => setModalConta(true)}>
              Nova Conta
            </Button>
          </div>
          <Row gutter={[16, 16]}>
            {contas.map(c => (
              <Col xs={24} sm={12} lg={8} key={c.id}>
                <Card title={c.nome}>
                  <p><b>Banco:</b> {c.banco || '-'}</p>
                  <p><b>Agência:</b> {c.agencia || '-'}</p>
                  <p><b>Conta:</b> {c.numeroConta || '-'}</p>
                  <Statistic
                    title="Saldo Atual"
                    value={c.saldoAtual}
                    prefix="R$"
                    precision={2}
                    valueStyle={{ color: c.saldoAtual >= 0 ? '#3f8600' : '#cf1322' }}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )
    },
    {
      key: 'fluxo',
      label: 'Fluxo de Caixa',
      children: (
        <>
          <Card style={{ marginBottom: 16 }}>
            <RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" onChange={gerarFluxo} />
          </Card>
          {fluxo && (
            <>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Card><Statistic title="Receitas Previstas" value={fluxo.receitas} prefix="R$" precision={2} valueStyle={{ color: '#3f8600' }} /></Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card><Statistic title="Despesas Previstas" value={fluxo.despesas} prefix="R$" precision={2} valueStyle={{ color: '#cf1322' }} /></Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card><Statistic title="Saldo Previsto" value={fluxo.saldoPrevisto} prefix="R$" precision={2} valueStyle={{ color: fluxo.saldoPrevisto >= 0 ? '#3f8600' : '#cf1322' }} /></Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card><Statistic title="Receitas Pagas" value={fluxo.receitasPagas} prefix="R$" precision={2} valueStyle={{ color: '#3f8600' }} /></Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card><Statistic title="Despesas Pagas" value={fluxo.despesasPagas} prefix="R$" precision={2} valueStyle={{ color: '#cf1322' }} /></Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card><Statistic title="Saldo Realizado" value={fluxo.saldoRealizado} prefix="R$" precision={2} valueStyle={{ color: fluxo.saldoRealizado >= 0 ? '#3f8600' : '#cf1322' }} /></Card>
                </Col>
              </Row>
              <Divider>Por Categoria</Divider>
              <Table
                dataSource={fluxo.porCategoria}
                rowKey="categoria"
                pagination={false}
                columns={[
                  { title: 'Categoria', dataIndex: 'categoria' },
                  { title: 'Tipo', dataIndex: 'tipo', render: (t) => <Tag color={t === 'Receita' ? 'green' : 'red'}>{t}</Tag> },
                  { title: 'Total', dataIndex: 'total', render: (v) => `R$ ${v?.toFixed(2)}` },
                ]}
              />
            </>
          )}
        </>
      )
    }
  ];

  return (
    <>
      <h2>Financeiro</h2>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card><Statistic title="A Receber" value={totalReceber} prefix="R$" precision={2} valueStyle={{ color: '#3f8600' }} /></Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card><Statistic title="A Pagar" value={totalPagar} prefix="R$" precision={2} valueStyle={{ color: '#cf1322' }} /></Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card><Statistic title="Saldo em Contas" value={totalContas} prefix="R$" precision={2} valueStyle={{ color: totalContas >= 0 ? '#3f8600' : '#cf1322' }} /></Card>
        </Col>
      </Row>

      <Tabs items={tabItems} />

      <Modal
        title={tipoModal === 'Receita' ? 'Nova Receita' : 'Nova Despesa'}
        open={modalLancamento}
        onCancel={() => { setModalLancamento(false); formLancamento.resetFields(); }}
        onOk={() => formLancamento.submit()}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form form={formLancamento} layout="vertical" onFinish={salvarLancamento}>
          <Form.Item name="descricao" label="Descrição" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="valor" label="Valor" rules={[{ required: true }]}>
                <InputNumber min={0} precision={2} prefix="R$" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="totalParcelas" label="Parcelas">
                <InputNumber min={1} max={36} style={{ width: '100%' }} placeholder="1" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="dataVencimento" label="Data de Vencimento" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="categoria" label="Categoria">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="formaPagamento" label="Forma de Pagamento">
                <Select allowClear placeholder="Selecione">
                  <Option value="Dinheiro">Dinheiro</Option>
                  <Option value="Cartão de Crédito">Cartão de Crédito</Option>
                  <Option value="Cartão de Débito">Cartão de Débito</Option>
                  <Option value="Pix">Pix</Option>
                  <Option value="Boleto">Boleto</Option>
                  <Option value="Transferência">Transferência</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contaBancariaId" label="Conta Bancária">
                <Select allowClear placeholder="Selecione">
                  {contas.map(c => <Option key={c.id} value={c.id}>{c.nome}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="pessoaId" label="Pessoa">
                <Select allowClear placeholder="Selecione" showSearch optionFilterProp="children">
                  {pessoas.map(p => <Option key={p.id} value={p.id}>{p.nome}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="Nova Conta Bancária"
        open={modalConta}
        onCancel={() => { setModalConta(false); formConta.resetFields(); }}
        onOk={() => formConta.submit()}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form form={formConta} layout="vertical" onFinish={salvarConta}>
          <Form.Item name="nome" label="Nome da Conta" rules={[{ required: true }]}>
            <Input placeholder="Ex: Conta Principal, Caixa" />
          </Form.Item>
          <Form.Item name="banco" label="Banco">
            <Input placeholder="Ex: Bradesco, Itaú, Nubank" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="agencia" label="Agência">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="numeroConta" label="Número da Conta">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="saldoInicial" label="Saldo Inicial" rules={[{ required: true }]}>
            <InputNumber min={0} precision={2} prefix="R$" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Financeiro;