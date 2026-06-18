import { useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Tag, Space, Row, Col, DatePicker, Divider, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const TabelaPreco = () => {
  const [tabelas, setTabelas] = useState([]);
  const [modalTabela, setModalTabela] = useState(false);
  const [modalRegra, setModalRegra] = useState(false);
  const [tabelaEditando, setTabelaEditando] = useState(null);
  const [tabelaSelecionada, setTabelaSelecionada] = useState(null);
  const [formTabela] = Form.useForm();
  const [formRegra] = Form.useForm();

  const abrirModalTabela = (tabela = null) => {
    setTabelaEditando(tabela);
    if (tabela) {
      formTabela.setFieldsValue({
        ...tabela,
        vigencia: tabela.vigenciaInicio ? [dayjs(tabela.vigenciaInicio), dayjs(tabela.vigenciaFim)] : null,
      });
    } else {
      formTabela.resetFields();
    }
    setModalTabela(true);
  };

  const salvarTabela = (values) => {
    const dados = {
      ...values,
      vigenciaInicio: values.vigencia ? values.vigencia[0].toISOString() : null,
      vigenciaFim: values.vigencia ? values.vigencia[1].toISOString() : null,
      regras: tabelaEditando?.regras || [],
    };
    delete dados.vigencia;

    if (tabelaEditando) {
      setTabelas(tabelas.map(t => t.id === tabelaEditando.id ? { ...t, ...dados } : t));
      message.success('Tabela atualizada!');
    } else {
      setTabelas([...tabelas, { ...dados, id: tabelas.length + 1 }]);
      message.success('Tabela criada!');
    }
    setModalTabela(false);
    formTabela.resetFields();
  };

  const salvarRegra = (values) => {
    const novaRegra = { ...values, id: (tabelaSelecionada.regras?.length || 0) + 1 };
    const tabelaAtualizada = {
      ...tabelaSelecionada,
      regras: [...(tabelaSelecionada.regras || []), novaRegra],
    };
    setTabelas(tabelas.map(t => t.id === tabelaSelecionada.id ? tabelaAtualizada : t));
    setTabelaSelecionada(tabelaAtualizada);
    message.success('Regra adicionada!');
    setModalRegra(false);
    formRegra.resetFields();
  };

  const removerRegra = (tabelaId, regraId) => {
    const tabelaAtualizada = {
      ...tabelaSelecionada,
      regras: tabelaSelecionada.regras.filter(r => r.id !== regraId),
    };
    setTabelas(tabelas.map(t => t.id === tabelaId ? tabelaAtualizada : t));
    setTabelaSelecionada(tabelaAtualizada);
    message.success('Regra removida!');
  };

  const colunas = [
    { title: '#', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Nome', dataIndex: 'nome', key: 'nome' },
    {
      title: 'Tipo', dataIndex: 'tipo', key: 'tipo',
      render: v => <Tag color={v === 'Desconto' ? 'green' : 'orange'}>{v}</Tag>
    },
    { title: 'Valor (%)', dataIndex: 'valor', key: 'valor', render: v => `${v}%` },
    {
      title: 'Vigência', key: 'vigencia',
      render: (_, r) => r.vigenciaInicio
        ? `${dayjs(r.vigenciaInicio).format('DD/MM/YYYY')} a ${dayjs(r.vigenciaFim).format('DD/MM/YYYY')}`
        : 'Sem vigência'
    },
    { title: 'Regras', key: 'regras', render: (_, r) => `${r.regras?.length || 0} regra(s)` },
    {
      title: 'Ações', key: 'acoes',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => abrirModalTabela(record)} />
          <Button size="small" onClick={() => { setTabelaSelecionada(record); }}>
            Regras
          </Button>
          <Popconfirm title="Excluir tabela?" onConfirm={() => setTabelas(tabelas.filter(t => t.id !== record.id))} okText="Sim" cancelText="Não">
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const colunasRegras = [
    {
      title: 'Aplica a', dataIndex: 'aplicaA', key: 'aplicaA',
      render: v => <Tag>{v}</Tag>
    },
    { title: 'Referência', dataIndex: 'referencia', key: 'referencia' },
    { title: 'Qtd Mínima', dataIndex: 'qtdMinima', key: 'qtdMinima', render: v => v || '-' },
    { title: 'Valor (%)', dataIndex: 'valor', key: 'valor', render: v => `${v}%` },
    {
      title: 'Ações', key: 'acoes',
      render: (_, record) => (
        <Popconfirm title="Remover regra?" onConfirm={() => removerRegra(tabelaSelecionada.id, record.id)} okText="Sim" cancelText="Não">
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      )
    }
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Tabelas de Preço</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => abrirModalTabela()}>
          Nova Tabela
        </Button>
      </div>

      <Table dataSource={tabelas} columns={colunas} rowKey="id" />

      {tabelaSelecionada && (
        <>
          <Divider>Regras — {tabelaSelecionada.nome}</Divider>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalRegra(true)}>
              Nova Regra
            </Button>
          </div>
          <Table dataSource={tabelaSelecionada.regras || []} columns={colunasRegras} rowKey="id" />
        </>
      )}

      {/* Modal Tabela */}
      <Modal
        title={tabelaEditando ? 'Editar Tabela' : 'Nova Tabela de Preço'}
        open={modalTabela}
        onCancel={() => { setModalTabela(false); formTabela.resetFields(); }}
        onOk={() => formTabela.submit()}
        okText="Salvar"
        cancelText="Cancelar"
        width={600}
      >
        <Form form={formTabela} layout="vertical" onFinish={salvarTabela}>
          <Form.Item name="nome" label="Nome da Tabela" rules={[{ required: true }]}>
            <Input placeholder="Ex: Tabela Varejo, Tabela Atacado" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]}>
                <Select>
                  <Option value="Desconto">Desconto</Option>
                  <Option value="Acréscimo">Acréscimo</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="valor" label="Valor Geral (%)" rules={[{ required: true }]}>
                <InputNumber min={0} max={100} precision={2} suffix="%" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="grupoCliente" label="Grupo de Cliente">
            <Input placeholder="Ex: Atacado, Varejo, VIP" />
          </Form.Item>
          <Form.Item name="vigencia" label="Vigência (opcional)">
            <RangePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="observacao" label="Observação">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Regra */}
      <Modal
        title="Nova Regra"
        open={modalRegra}
        onCancel={() => { setModalRegra(false); formRegra.resetFields(); }}
        onOk={() => formRegra.submit()}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form form={formRegra} layout="vertical" onFinish={salvarRegra}>
          <Form.Item name="aplicaA" label="Aplica a" rules={[{ required: true }]}>
            <Select>
              <Option value="Produto">Produto específico</Option>
              <Option value="Categoria">Categoria de produto</Option>
              <Option value="GrupoCliente">Grupo de cliente</Option>
              <Option value="Todos">Todos os produtos</Option>
            </Select>
          </Form.Item>
          <Form.Item name="referencia" label="Referência (ID ou nome)">
            <Input placeholder="Ex: ID do produto, nome da categoria..." />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="qtdMinima" label="Quantidade Mínima">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="Deixe vazio para qualquer qtd" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="valor" label="Valor (%)" rules={[{ required: true }]}>
                <InputNumber min={0} max={100} precision={2} suffix="%" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
};

export default TabelaPreco;