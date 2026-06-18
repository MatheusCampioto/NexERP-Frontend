import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Tag, Space, Row, Col, DatePicker, Popconfirm, Divider, Tabs, Card, Statistic } from 'antd';
import { PlusOutlined, EyeOutlined, CheckOutlined, CloseOutlined, PrinterOutlined } from '@ant-design/icons';
import { listarOrdensServico, criarOrdemServico, atualizarStatus, finalizarOrdem, cancelarOrdem } from '../services/ordemServicoService';
import { listarPessoas } from '../services/pessoasService';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const { Option } = Select;
const { TextArea } = Input;

const statusCor = { Aberta: 'blue', EmAndamento: 'orange', Concluida: 'green', Cancelada: 'red' };
const prioridadeCor = { Baixa: 'default', Normal: 'blue', Alta: 'orange', Urgente: 'red' };

const OrdemServico = () => {
  const [ordens, setOrdens] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalNova, setModalNova] = useState(false);
  const [modalDetalhe, setModalDetalhe] = useState(false);
  const [modalFinalizar, setModalFinalizar] = useState(false);
  const [ordemSelecionada, setOrdemSelecionada] = useState(null);
  const [itens, setItens] = useState([{ descricao: '', quantidade: 1, valorUnitario: 0 }]);
  const [form] = Form.useForm();
  const [formFinalizar] = Form.useForm();

  const carregar = async () => {
    setLoading(true);
    try {
      const [o, p] = await Promise.all([listarOrdensServico(), listarPessoas()]);
      setOrdens(o);
      setPessoas(p);
    } catch {
      message.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const salvar = async (values) => {
    try {
      await criarOrdemServico({
        pessoaId: values.pessoaId,
        titulo: values.titulo,
        descricao: values.descricao,
        prioridade: values.prioridade,
        valorEstimado: values.valorEstimado,
        dataPrevista: values.dataPrevista ? values.dataPrevista.toISOString() : null,
        tecnico: values.tecnico,
        observacao: values.observacao,
        itens: itens.filter(i => i.descricao),
      });
      message.success('Ordem de serviço criada!');
      setModalNova(false);
      form.resetFields();
      setItens([{ descricao: '', quantidade: 1, valorUnitario: 0 }]);
      carregar();
    } catch (e) {
      message.error(e.response?.data?.mensagem || 'Erro ao criar ordem.');
    }
  };

  const mudarStatus = async (id, status) => {
    try {
      await atualizarStatus(id, status);
      message.success(`Status atualizado para ${status}!`);
      carregar();
    } catch (e) {
      message.error(e.response?.data?.mensagem || 'Erro ao atualizar status.');
    }
  };

  const finalizar = async (values) => {
    try {
      await finalizarOrdem(ordemSelecionada.id, values.valorFinal, values.observacao);
      message.success('Ordem finalizada!');
      setModalFinalizar(false);
      formFinalizar.resetFields();
      carregar();
    } catch (e) {
      message.error(e.response?.data?.mensagem || 'Erro ao finalizar ordem.');
    }
  };

  const cancelar = async (id) => {
    try {
      await cancelarOrdem(id);
      message.success('Ordem cancelada!');
      carregar();
    } catch (e) {
      message.error(e.response?.data?.mensagem || 'Erro ao cancelar ordem.');
    }
  };

  const imprimirOS = (os) => {
    const doc = new jsPDF();
    const agora = dayjs().format('DD/MM/YYYY HH:mm');
    doc.setFontSize(18);
    doc.text('NexERP', 14, 16);
    doc.setFontSize(14);
    doc.text(`Ordem de Serviço #${os.id}`, 14, 26);
    doc.setFontSize(10);
    doc.text(`Emitido em: ${agora}`, 14, 33);
    doc.setFontSize(11);
    doc.text(`Título: ${os.titulo}`, 14, 43);
    doc.text(`Cliente: ${os.pessoa?.nome || '-'}`, 14, 51);
    doc.text(`Técnico: ${os.tecnico || '-'}`, 14, 59);
    doc.text(`Status: ${os.status}`, 14, 67);
    doc.text(`Prioridade: ${os.prioridade}`, 100, 67);
    doc.text(`Data Prevista: ${os.dataPrevista ? dayjs(os.dataPrevista).format('DD/MM/YYYY') : '-'}`, 14, 75);
    doc.text(`Data Conclusão: ${os.dataConclusao ? dayjs(os.dataConclusao).format('DD/MM/YYYY') : '-'}`, 100, 75);
    if (os.descricao) {
      doc.text('Descrição do Problema:', 14, 85);
      const linhas = doc.splitTextToSize(os.descricao, 180);
      doc.text(linhas, 14, 93);
    }
    let startY = os.descricao ? 93 + (doc.splitTextToSize(os.descricao, 180).length * 7) : 85;
    if (os.itens?.length > 0) {
      autoTable(doc, {
        startY: startY + 5,
        head: [['Descrição', 'Qtd', 'Valor Unit.', 'Subtotal']],
        body: os.itens.map(i => [i.descricao, i.quantidade, `R$ ${i.valorUnitario?.toFixed(2)}`, `R$ ${(i.quantidade * i.valorUnitario).toFixed(2)}`]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [22, 119, 255] },
      });
      startY = doc.lastAutoTable.finalY + 10;
    }
    doc.setFontSize(11);
    if (os.valorEstimado) doc.text(`Valor Estimado: R$ ${os.valorEstimado.toFixed(2)}`, 14, startY);
    if (os.valorFinal) { doc.setFontSize(13); doc.text(`Valor Final: R$ ${os.valorFinal.toFixed(2)}`, 14, startY + 10); }
    if (os.observacao) { doc.setFontSize(10); doc.text(`Observação: ${os.observacao}`, 14, startY + 20); }
    doc.save(`OS_${os.id}.pdf`);
  };

  const adicionarItem = () => setItens([...itens, { descricao: '', quantidade: 1, valorUnitario: 0 }]);
  const atualizarItem = (index, campo, valor) => { const n = [...itens]; n[index][campo] = valor; setItens(n); };
  const removerItem = (index) => setItens(itens.filter((_, i) => i !== index));

  const colunas = [
    { title: '#', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Título', dataIndex: 'titulo', key: 'titulo' },
    { title: 'Cliente', key: 'cliente', render: (_, r) => r.pessoa?.nome || '-' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={statusCor[s]}>{s}</Tag> },
    { title: 'Prioridade', dataIndex: 'prioridade', key: 'prioridade', render: (p) => <Tag color={prioridadeCor[p]}>{p}</Tag> },
    { title: 'Valor Est.', dataIndex: 'valorEstimado', key: 'valorEstimado', render: (v) => v ? `R$ ${v.toFixed(2)}` : '-' },
    { title: 'Data Prevista', dataIndex: 'dataPrevista', key: 'dataPrevista', render: (d) => d ? dayjs(d).format('DD/MM/YYYY') : '-' },
    {
      title: 'Ações', key: 'acoes',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => { setOrdemSelecionada(record); setModalDetalhe(true); }}>Ver</Button>
          <Button size="small" icon={<PrinterOutlined />} onClick={() => imprimirOS(record)} />
          {record.status === 'Aberta' && <Button size="small" onClick={() => mudarStatus(record.id, 'EmAndamento')}>Iniciar</Button>}
          {(record.status === 'Aberta' || record.status === 'EmAndamento') && (
            <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => { setOrdemSelecionada(record); setModalFinalizar(true); }}>Finalizar</Button>
          )}
          {record.status !== 'Concluida' && record.status !== 'Cancelada' && (
            <Popconfirm title="Cancelar ordem?" onConfirm={() => cancelar(record.id)} okText="Sim" cancelText="Não">
              <Button size="small" danger icon={<CloseOutlined />}>Cancelar</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  const tabItems = [
    {
      key: 'ordens',
      label: 'Ordens de Serviço',
      children: <Table dataSource={ordens} columns={colunas} rowKey="id" loading={loading} />
    },
    {
      key: 'historico',
      label: 'Histórico',
      children: (
        <Table
          dataSource={[...ordens].sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))}
          rowKey="id"
          loading={loading}
          columns={[
            { title: '#', dataIndex: 'id', key: 'id', width: 60 },
            { title: 'Título', dataIndex: 'titulo', key: 'titulo' },
            { title: 'Cliente', key: 'cliente', render: (_, r) => r.pessoa?.nome || '-' },
            { title: 'Técnico', dataIndex: 'tecnico', key: 'tecnico', render: v => v || '-' },
            { title: 'Status', dataIndex: 'status', key: 'status', render: s => <Tag color={statusCor[s]}>{s}</Tag> },
            { title: 'Valor Final', dataIndex: 'valorFinal', key: 'valorFinal', render: v => v ? `R$ ${v.toFixed(2)}` : '-' },
            { title: 'Conclusão', dataIndex: 'dataConclusao', key: 'dataConclusao', render: d => d ? dayjs(d).format('DD/MM/YYYY') : '-' },
          ]}
        />
      )
    },
    {
      key: 'relatorios',
      label: 'Relatórios',
      children: (
        <Row gutter={16}>
          <Col span={6}><Card size="small"><Statistic title="Total de OS" value={ordens.length} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="Abertas" value={ordens.filter(o => o.status === 'Aberta').length} valueStyle={{ color: 'blue' }} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="Concluídas" value={ordens.filter(o => o.status === 'Concluida').length} valueStyle={{ color: 'green' }} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="Valor Total" value={ordens.filter(o => o.valorFinal).reduce((acc, o) => acc + o.valorFinal, 0)} precision={2} prefix="R$" /></Card></Col>
          <Col span={24} style={{ marginTop: 16 }}>
            <Card title="OS por Status" size="small">
              <Table
                dataSource={['Aberta', 'EmAndamento', 'Concluida', 'Cancelada'].map(s => ({
                  status: s,
                  total: ordens.filter(o => o.status === s).length,
                  valor: ordens.filter(o => o.status === s && o.valorFinal).reduce((acc, o) => acc + o.valorFinal, 0)
                }))}
                rowKey="status"
                size="small"
                pagination={false}
                columns={[
                  { title: 'Status', dataIndex: 'status', key: 'status', render: s => <Tag color={statusCor[s]}>{s}</Tag> },
                  { title: 'Quantidade', dataIndex: 'total', key: 'total' },
                  { title: 'Valor Total', dataIndex: 'valor', key: 'valor', render: v => `R$ ${v.toFixed(2)}` },
                ]}
              />
            </Card>
          </Col>
        </Row>
      )
    }
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Ordens de Serviço</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalNova(true)}>Nova OS</Button>
      </div>

      <Tabs items={tabItems} />

      {/* Modal Nova OS */}
<Modal title="Nova Ordem de Serviço" open={modalNova}
  onCancel={() => { setModalNova(false); form.resetFields(); setItens([{ descricao: '', quantidade: 1, valorUnitario: 0 }]); }}
  onOk={() => form.submit()} okText="Salvar" cancelText="Cancelar" width={900}>
  <Form form={form} layout="vertical" onFinish={salvar}>
    <Tabs items={[
      {
        key: 'identificacao',
        label: 'Identificação',
        children: (
          <>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="tipoOS" label="Tipo de OS">
                  <Select allowClear placeholder="Selecione">
                    <Option value="Manutencao">Manutenção</Option>
                    <Option value="Instalacao">Instalação</Option>
                    <Option value="Suporte">Suporte</Option>
                    <Option value="Consultoria">Consultoria</Option>
                    <Option value="Vistoria">Vistoria</Option>
                    <Option value="Outros">Outros</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={10}>
                <Form.Item name="titulo" label="Título" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="prioridade" label="Prioridade" initialValue="Normal">
                  <Select>
                    <Option value="Baixa">Baixa</Option>
                    <Option value="Normal">Normal</Option>
                    <Option value="Alta">Alta</Option>
                    <Option value="Urgente">Urgente</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="pessoaId" label="Cliente" rules={[{ required: true }]}>
                  <Select showSearch optionFilterProp="children" placeholder="Selecione o cliente">
                    {pessoas.map(p => <Option key={p.id} value={p.id}>{p.razaoSocial || p.nome}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="contatoResponsavel" label="Contato Responsável">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="telefoneContato" label="Telefone Contato">
                  <Input placeholder="(00) 00000-0000" maxLength={16} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="tecnico" label="Técnico Responsável">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="dataPrevista" label="Data Prevista">
                  <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="garantiaDias" label="Garantia (dias)">
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="Ex: 90" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="descricao" label="Descrição do Problema">
              <TextArea rows={3} />
            </Form.Item>
          </>
        )
      },
      {
        key: 'equipamento',
        label: 'Equipamento',
        children: (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="equipamentoDescricao" label="Descrição do Equipamento">
                  <Input placeholder="Ex: Notebook Dell Inspiron" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="equipamentoMarca" label="Marca">
                  <Input placeholder="Ex: Dell, HP, Samsung" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="equipamentoModelo" label="Modelo">
                  <Input placeholder="Ex: Inspiron 15 3000" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="equipamentoNumeroSerie" label="Número de Série">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
          </>
        )
      },
      {
        key: 'itens',
        label: 'Itens / Serviços',
        children: (
          <>
            {itens.map((item, index) => (
              <Row gutter={8} key={index} style={{ marginBottom: 8 }}>
                <Col span={9}>
                  <Input placeholder="Descrição" value={item.descricao} onChange={e => atualizarItem(index, 'descricao', e.target.value)} />
                </Col>
                <Col span={3}>
                  <InputNumber placeholder="Qtd" min={0} precision={2} value={item.quantidade} onChange={v => atualizarItem(index, 'quantidade', v)} style={{ width: '100%' }} />
                </Col>
                <Col span={3}>
                  <Input placeholder="UN" value={item.unidade} onChange={e => atualizarItem(index, 'unidade', e.target.value)} maxLength={5} />
                </Col>
                <Col span={5}>
                  <InputNumber placeholder="Valor Unit." min={0} precision={2} prefix="R$" value={item.valorUnitario} onChange={v => atualizarItem(index, 'valorUnitario', v)} style={{ width: '100%' }} />
                </Col>
                <Col span={3}>
                  <Input placeholder="CFOP" value={item.cfop} onChange={e => atualizarItem(index, 'cfop', e.target.value)} maxLength={5} />
                </Col>
                <Col span={1}>
                  <Button danger onClick={() => removerItem(index)} disabled={itens.length === 1}>X</Button>
                </Col>
              </Row>
            ))}
            <Button type="dashed" onClick={adicionarItem} block style={{ marginBottom: 8 }}>+ Adicionar Item</Button>
            <Row justify="end">
              <Col><b>Total: R$ {itens.reduce((acc, i) => acc + ((i.quantidade || 0) * (i.valorUnitario || 0)), 0).toFixed(2)}</b></Col>
            </Row>
          </>
        )
      },
      {
        key: 'financeiro',
        label: 'Financeiro',
        children: (
          <>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="valorEstimado" label="Valor Estimado">
                  <InputNumber min={0} precision={2} prefix="R$" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
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
                <Form.Item name="condicaoPagamento" label="Condição de Pagamento">
                  <Select allowClear>
                    <Option value="AVista">À Vista</Option>
                    <Option value="30dias">30 dias</Option>
                    <Option value="30_60dias">30/60 dias</Option>
                    <Option value="30_60_90dias">30/60/90 dias</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </>
        )
      },
      {
        key: 'observacoes',
        label: 'Observações',
        children: (
          <>
            <Form.Item name="observacao" label="Observação para o Cliente (aparece no PDF)">
              <TextArea rows={3} />
            </Form.Item>
            <Form.Item name="observacaoInterna" label="Observação Interna (não aparece no PDF)">
              <TextArea rows={3} />
            </Form.Item>
          </>
        )
      }
    ]} />
  </Form>
</Modal>

      {/* Modal Detalhe */}
      <Modal
        title={`OS #${ordemSelecionada?.id} — ${ordemSelecionada?.titulo}`}
        open={modalDetalhe}
        onCancel={() => setModalDetalhe(false)}
        footer={[
          <Button key="pdf" icon={<PrinterOutlined />} onClick={() => imprimirOS(ordemSelecionada)}>PDF</Button>,
          <Button key="fechar" onClick={() => setModalDetalhe(false)}>Fechar</Button>
        ]}
        width={650}
      >
        {ordemSelecionada && (
          <>
            <Row gutter={16}>
              <Col span={12}><b>Cliente:</b> {ordemSelecionada.pessoa?.nome}</Col>
              <Col span={12}><b>Técnico:</b> {ordemSelecionada.tecnico || '-'}</Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 8 }}>
              <Col span={12}><b>Status:</b> <Tag color={statusCor[ordemSelecionada.status]}>{ordemSelecionada.status}</Tag></Col>
              <Col span={12}><b>Prioridade:</b> <Tag color={prioridadeCor[ordemSelecionada.prioridade]}>{ordemSelecionada.prioridade}</Tag></Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 8 }}>
              <Col span={12}><b>Valor Estimado:</b> {ordemSelecionada.valorEstimado ? `R$ ${ordemSelecionada.valorEstimado.toFixed(2)}` : '-'}</Col>
              <Col span={12}><b>Valor Final:</b> {ordemSelecionada.valorFinal ? `R$ ${ordemSelecionada.valorFinal.toFixed(2)}` : '-'}</Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 8 }}>
              <Col span={12}><b>Data Prevista:</b> {ordemSelecionada.dataPrevista ? dayjs(ordemSelecionada.dataPrevista).format('DD/MM/YYYY') : '-'}</Col>
              <Col span={12}><b>Data Conclusão:</b> {ordemSelecionada.dataConclusao ? dayjs(ordemSelecionada.dataConclusao).format('DD/MM/YYYY') : '-'}</Col>
            </Row>
            {ordemSelecionada.descricao && <><Divider /><b>Descrição:</b><p>{ordemSelecionada.descricao}</p></>}
            {ordemSelecionada.observacao && <><b>Observação:</b><p>{ordemSelecionada.observacao}</p></>}
            {ordemSelecionada.itens?.length > 0 && (
              <>
                <Divider>Itens</Divider>
                <Table
                  dataSource={ordemSelecionada.itens}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: 'Descrição', dataIndex: 'descricao', key: 'descricao' },
                    { title: 'Qtd', dataIndex: 'quantidade', key: 'quantidade' },
                    { title: 'Valor Unit.', dataIndex: 'valorUnitario', key: 'valorUnitario', render: v => `R$ ${v.toFixed(2)}` },
                    { title: 'Subtotal', key: 'subtotal', render: (_, r) => `R$ ${(r.quantidade * r.valorUnitario).toFixed(2)}` },
                  ]}
                />
              </>
            )}
          </>
        )}
      </Modal>

      {/* Modal Finalizar */}
      <Modal title="Finalizar Ordem de Serviço" open={modalFinalizar}
        onCancel={() => { setModalFinalizar(false); formFinalizar.resetFields(); }}
        onOk={() => formFinalizar.submit()} okText="Finalizar" cancelText="Cancelar">
        <Form form={formFinalizar} layout="vertical" onFinish={finalizar}>
          <Form.Item name="valorFinal" label="Valor Final Cobrado" rules={[{ required: true }]}>
            <InputNumber min={0} precision={2} prefix="R$" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="observacao" label="Observação Final">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default OrdemServico;