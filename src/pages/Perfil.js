import { useState} from 'react';
import { Card, Form, Input, Button, message, Row, Col, Divider, Avatar, Tag } from 'antd';
import { UserOutlined, LockOutlined, SaveOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Perfil = () => {
  const { usuario } = useAuth();
  const [loadingSenha, setLoadingSenha] = useState(false);
  const [formSenha] = Form.useForm();

  const alterarSenha = async (values) => {
    if (values.novaSenha !== values.confirmarSenha) {
      message.error('As senhas não coincidem.');
      return;
    }
    setLoadingSenha(true);
    try {
      await api.put('/Usuarios/alterar-senha', {
        senhaAtual: values.senhaAtual,
        novaSenha: values.novaSenha,
      });
      message.success('Senha alterada com sucesso!');
      formSenha.resetFields();
    } catch (e) {
      message.error(e.response?.data?.mensagem || 'Erro ao alterar senha.');
    } finally {
      setLoadingSenha(false);
    }
  };

  return (
    <>
      <h2>Meu Perfil</h2>

      <Row gutter={24}>
        <Col xs={24} lg={8}>
          <Card>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <Avatar size={80} icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
              <h2 style={{ marginTop: 16, marginBottom: 4 }}>{usuario?.nome}</h2>
              <Tag color="blue">{usuario?.perfil}</Tag>
              <p style={{ color: '#888', marginTop: 8 }}>{usuario?.email}</p>
            </div>
            <Divider />
            <div>
              <p><b>Nome:</b> {usuario?.nome}</p>
              <p><b>E-mail:</b> {usuario?.email}</p>
              <p><b>Perfil:</b> {usuario?.perfil}</p>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title={<><LockOutlined /> Alterar Senha</>}>
            <Form form={formSenha} layout="vertical" onFinish={alterarSenha}>
              <Form.Item
                name="senhaAtual"
                label="Senha Atual"
                rules={[{ required: true, message: 'Digite sua senha atual' }]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item
                name="novaSenha"
                label="Nova Senha"
                rules={[
                  { required: true, message: 'Digite a nova senha' },
                  { min: 6, message: 'A senha deve ter no mínimo 6 caracteres' }
                ]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item
                name="confirmarSenha"
                label="Confirmar Nova Senha"
                rules={[{ required: true, message: 'Confirme a nova senha' }]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loadingSenha}>
                  Salvar Nova Senha
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default Perfil;