import { useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Tag, Space, Row, Col, DatePicker, Divider, Tabs, Card, Statistic } from 'antd';
import { PlusOutlined, EyeOutlined, PrinterOutlined, StopOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const statusCor = {
  Pendente: 'orange',
  Autorizada: 'green',
  Cancelada: 'red',
  Rejeitada: 'volcano',
  Contingencia: 'purple',
};

const Faturamento = () => {
  const [notas, setNotas] = useState([]);
  const [modalNova, setModalNova] = useState(false);
  const [modalDetalhe, setModalDetalhe] = useState(false);
  const [notaSelecionada, setNotaSelecionada] = useState(null);
  const [tipoNota, setTipoNota] = useState('NFe');
  const [itens, setItens] = useState([{ descricao: '', quantidade: 1, valorUnitario: 0, cfop: '', ncm: '' }]);
  const [filtroPeriodo, setFiltroPeriodo] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState(null);
  const [busca, setBusca] = useState('');
  const [form] = Form.useForm();

  const notasFiltradas = notas.filter(n => {
    if (filtroStatus && n.status !== filtroStatus) return false;
    if (filtroTipo && n.tipo !== filtroTipo) return false;
    if (busca && !n.numero?.includes(busca) && !n.cliente?.toLowerCase().includes(busca.toLowerCase())) return false;
    if (filtroPeriodo) {
      const data = new Date(n.dataEmissao);
      if (data < filtroPeriodo[0].toDate() || data > filtroPeriodo[1].toDate()) return false;
    }
    return true;
  });

  const totalFaturado = notasFiltradas.filter(n => n.status === 'Autorizada').reduce((acc, n) => acc + (n.valorTotal || 0), 0);
  const totalPendente = notasFiltradas.filter(n => n.status === 'Pendente').length;
  const totalAutorizada = notasFiltradas.filter(n => n.status === 'Autorizada').length;
  const totalCancelada = notasFiltradas.filter(n => n.status === 'Cancelada').length;

  const salvar = (values) => {
    const nova = {
      ...values,
      id: notas.length + 1,
      numero: String(notas.length + 1).padStart(6, '0'),
      status: 'Pendente',
      tipo: tipoNota,
      dataEmissao: new Date().toISOString(),
      itens,
      valorTotal: itens.reduce((acc, i) => acc + ((i.quantidade || 0) * (i.valorUnitario || 0)), 0),
    };
    setNotas([...notas, nova]);
    message.success('Nota fiscal criada com status Pendente!');
    setModalNova(false);
    form.resetFields();
    setItens([{ descricao: '', quantidade: 1, valorUnitario: 0, cfop: '', ncm: '' }]);
  };

  const cancelar = (id) => {
    setNotas(notas.map(n => n.id === id ? { ...n, status: 'Cancelada' } : n));
    message.success('Nota cancelada!');
  };

  const atualizarItem = (index, campo, valor) => {
    const novos = [...itens];
    novos[index][campo] = valor;
    setItens(novos);
  };

  const colunas = [
    { title: 'Número', dataIndex: 'numero', key: 'numero', width: 100 },
    { title: 'Tipo', dataIndex: 'tipo', key: 'tipo', render: v => <Tag color="blue">{v}</Tag> },
    { title: 'Cliente', dataIndex: 'cliente', key: 'cliente' },
    { title: 'Valor Total', dataIndex: 'valorTotal', key: 'valorTotal', render: v => `R$ ${v?.toFixed(2)}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: s => <Tag color={statusCor[s]}>{s}</Tag> },
    { title: 'Emissão', dataIndex: 'dataEmissao', key: 'dataEmissao', render: d => dayjs(d).format('DD/MM/YYYY HH:mm') },
    {
      title: 'Ações', key: 'acoes',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => { setNotaSelecionada(record); setModalDetalhe(true); }}>Ver</Button>
          <Button size="small" icon={<PrinterOutlined />}>DANFE</Button>
          {record.status !== 'Cancelada' && record.status !== 'Rejeitada' && (
            <Button size="small" danger icon={<StopOutlined />} onClick={() => cancelar(record.id)}>Cancelar</Button>
          )}
        </Space>
      )
    }
  ];

  const tabItems = [
    {
      key: 'notas',
      label: 'Notas Fiscais',
      children: (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Input
                placeholder="Buscar por número ou cliente..."
                prefix={<SearchOutlined />}
                value={busca}
                onChange={e => setBusca(e.target.value)}
                allowClear
              />
            </Col>
            <Col span={5}>
              <Select placeholder="Tipo" style={{ width: '100%' }} allowClear onChange={setFiltroTipo}>
                <Option value="NFe">NF-e</Option>
                <Option value="NFSe">NFS-e</Option>
                <Option value="NFCe">NFC-e</Option>
              </Select>
            </Col>
            <Col span={5}>
              <Select placeholder="Status" style={{ width: '100%' }} allowClear onChange={setFiltroStatus}>
                <Option value="Pendente">Pendente</Option>
                <Option value="Autorizada">Autorizada</Option>
                <Option value="Cancelada">Cancelada</Option>
                <Option value="Rejeitada">Rejeitada</Option>
                <Option value="Contingencia">Contingência</Option>
              </Select>
            </Col>
            <Col span={8}>
              <RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" onChange={setFiltroPeriodo} />
            </Col>
          </Row>

          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}><Card size="small"><Statistic title="Total Faturado" value={totalFaturado} precision={2} prefix="R$" valueStyle={{ color: 'green' }} /></Card></Col>
            <Col span={6}><Card size="small"><Statistic title="Autorizadas" value={totalAutorizada} valueStyle={{ color: 'green' }} /></Card></Col>
            <Col span={6}><Card size="small"><Statistic title="Pendentes" value={totalPendente} valueStyle={{ color: 'orange' }} /></Card></Col>
            <Col span={6}><Card size="small"><Statistic title="Canceladas" value={totalCancelada} valueStyle={{ color: 'red' }} /></Card></Col>
          </Row>

          <Table dataSource={notasFiltradas} columns={colunas} rowKey="id" />
        </>
      )
    },
    {
      key: 'relatorios',
      label: 'Relatórios',
      children: (
        <Row gutter={16}>
          <Col span={8}>
            <Card title="Por Período" size="small">
              <RangePicker format="DD/MM/YYYY" style={{ width: '100%', marginBottom: 8 }} />
              <Button type="primary" block>Gerar</Button>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="Por Cliente" size="small">
              <Input placeholder="Nome do cliente" style={{ marginBottom: 8 }} />
              <Button type="primary" block>Gerar</Button>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="Por Produto" size="small">
              <Input placeholder="Nome do produto" style={{ marginBottom: 8 }} />
              <Button type="primary" block>Gerar</Button>
            </Card>
          </Col>
        </Row>
      )
    }
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Faturamento</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalNova(true)}>
          Nova Nota Fiscal
        </Button>
      </div>

      <Tabs items={tabItems} />

      {/* Modal Nova NF */}
      <Modal
        title="Nova Nota Fiscal"
        open={modalNova}
        onCancel={() => { setModalNova(false); form.resetFields(); setItens([{ descricao: '', quantidade: 1, valorUnitario: 0, cfop: '', ncm: '' }]); }}
        onOk={() => form.submit()}
        okText="Salvar"
        cancelText="Cancelar"
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={salvar}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Tipo de Nota" required>
                <Select value={tipoNota} onChange={setTipoNota}>
                  <Option value="NFe">NF-e (Produtos)</Option>
                  <Option value="NFSe">NFS-e (Serviços)</Option>
                  <Option value="NFCe">NFC-e (Consumidor Final)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="serie" label="Série">
                <Input placeholder="001" maxLength={3} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="naturezaOperacao" label="Natureza da Operação">
                <Input placeholder="Venda de mercadoria" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="cliente" label="Cliente" rules={[{ required: true }]}>
                <Input placeholder="Nome ou razão social" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="cpfCnpjCliente" label="CPF/CNPJ">
                <Input placeholder="000.000.000-00" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="formaPagamento" label="Forma de Pagamento">
                <Select allowClear>
                  <Option value="Dinheiro">Dinheiro</Option>
                  <Option value="PIX">PIX</Option>
                  <Option value="Boleto">Boleto</Option>
                  <Option value="CartaoCredito">Cartão de Crédito</Option>
                  <Option value="CartaoDebito">Cartão de Débito</Option>
                  <Option value="Transferencia">Transferência</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tipoPedido" label="Tipo de Pedido">
                <Input placeholder="Venda, Bonificação..." />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="transportadora" label="Transportadora">
                <Input placeholder="Nome da transportadora" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Itens</Divider>

          {itens.map((item, index) => (
            <Row gutter={8} key={index} style={{ marginBottom: 8 }}>
              <Col span={6}>
                <Input placeholder="Descrição" value={item.descricao} onChange={e => atualizarItem(index, 'descricao', e.target.value)} />
              </Col>
              <Col span={3}>
                <InputNumber placeholder="Qtd" min={0} precision={2} value={item.quantidade} onChange={v => atualizarItem(index, 'quantidade', v)} style={{ width: '100%' }} />
              </Col>
              <Col span={4}>
                <InputNumber placeholder="Vlr Unit." min={0} precision={2} prefix="R$" value={item.valorUnitario} onChange={v => atualizarItem(index, 'valorUnitario', v)} style={{ width: '100%' }} />
              </Col>
              <Col span={3}>
                <Input placeholder="CFOP" value={item.cfop} onChange={e => atualizarItem(index, 'cfop', e.target.value)} maxLength={5} />
              </Col>
              <Col span={4}>
                <Input placeholder="NCM" value={item.ncm} onChange={e => atualizarItem(index, 'ncm', e.target.value)} maxLength={10} />
              </Col>
              <Col span={3}>
                <InputNumber placeholder="ICMS%" min={0} max={100} precision={2} value={item.aliquotaICMS} onChange={v => atualizarItem(index, 'aliquotaICMS', v)} style={{ width: '100%' }} />
              </Col>
              <Col span={1}>
                <Button danger onClick={() => setItens(itens.filter((_, i) => i !== index))} disabled={itens.length === 1}>X</Button>
              </Col>
            </Row>
          ))}
          <Button type="dashed" block onClick={() => setItens([...itens, { descricao: '', quantidade: 1, valorUnitario: 0, cfop: '', ncm: '' }])} style={{ marginBottom: 16 }}>
            + Adicionar Item
          </Button>

          <Row justify="end">
            <Col>
              <strong>Total: R$ {itens.reduce((acc, i) => acc + ((i.quantidade || 0) * (i.valorUnitario || 0)), 0).toFixed(2)}</strong>
            </Col>
          </Row>

          <Divider>Informações Adicionais</Divider>
          <Form.Item name="observacao" label="Observação">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Detalhe */}
      <Modal
        title={`NF ${notaSelecionada?.tipo} #${notaSelecionada?.numero}`}
        open={modalDetalhe}
        onCancel={() => setModalDetalhe(false)}
        footer={[
          <Button key="danfe" icon={<PrinterOutlined />}>DANFE</Button>,
          <Button key="fechar" onClick={() => setModalDetalhe(false)}>Fechar</Button>
        ]}
        width={700}
      >
        {notaSelecionada && (
          <>
            <Row gutter={16}>
              <Col span={12}><b>Cliente:</b> {notaSelecionada.cliente}</Col>
              <Col span={12}><b>CPF/CNPJ:</b> {notaSelecionada.cpfCnpjCliente || '-'}</Col>
              <Col span={12} style={{ marginTop: 8 }}><b>Status:</b> <Tag color={statusCor[notaSelecionada.status]}>{notaSelecionada.status}</Tag></Col>
              <Col span={12} style={{ marginTop: 8 }}><b>Emissão:</b> {dayjs(notaSelecionada.dataEmissao).format('DD/MM/YYYY HH:mm')}</Col>
              <Col span={12} style={{ marginTop: 8 }}><b>Série:</b> {notaSelecionada.serie || '-'}</Col>
              <Col span={12} style={{ marginTop: 8 }}><b>Natureza:</b> {notaSelecionada.naturezaOperacao || '-'}</Col>
              <Col span={12} style={{ marginTop: 8 }}><b>Forma Pgto:</b> {notaSelecionada.formaPagamento || '-'}</Col>
              <Col span={12} style={{ marginTop: 8 }}><b>Transportadora:</b> {notaSelecionada.transportadora || '-'}</Col>
            </Row>
            <Divider>Itens</Divider>
            <Table
              dataSource={notaSelecionada.itens}
              rowKey="descricao"
              size="small"
              pagination={false}
              columns={[
                { title: 'Descrição', dataIndex: 'descricao', key: 'descricao' },
                { title: 'Qtd', dataIndex: 'quantidade', key: 'quantidade' },
                { title: 'Vlr Unit.', dataIndex: 'valorUnitario', key: 'valorUnitario', render: v => `R$ ${v?.toFixed(2)}` },
                { title: 'CFOP', dataIndex: 'cfop', key: 'cfop' },
                { title: 'NCM', dataIndex: 'ncm', key: 'ncm' },
                { title: 'Subtotal', key: 'subtotal', render: (_, r) => `R$ ${(r.quantidade * r.valorUnitario).toFixed(2)}` },
              ]}
            />
            <Divider />
            <Row justify="end">
              <Col><strong>Total: R$ {notaSelecionada.valorTotal?.toFixed(2)}</strong></Col>
            </Row>
            {notaSelecionada.observacao && <><Divider /><b>Observação:</b> {notaSelecionada.observacao}</>}
          </>
        )}
      </Modal>
    </>
  );
};

export default Faturamento;