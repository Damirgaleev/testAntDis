import { Modal, List, Input, Empty, Spin, Button, Space } from 'antd';
import { SearchOutlined, PhoneOutlined } from '@ant-design/icons';
import { useState, useMemo, useEffect } from 'react';

interface Client {
  id: number;
  name: string;
  phone: string;
  phone_code?: string;
  inn?: string;
  email?: string;
}

interface ClientSelectModalProps {
  visible: boolean;
  clients: Client[];
  loading: boolean;
  totalCount: number;
  onSelect: (client: Client) => void;
  onCancel: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const ClientSelectModal: React.FC<ClientSelectModalProps> = ({
  visible,
  clients,
  loading,
  totalCount,
  onSelect,
  onCancel,
  onLoadMore,
  hasMore = false,
}) => {
  const [searchText, setSearchText] = useState('');

  const filteredClients = useMemo(() => {
    if (!searchText) return clients;
    const search = searchText.toLowerCase();
    return clients.filter((client) => {
      const phone = client.phone?.toLowerCase() || '';
      const name = client.name?.toLowerCase() || '';
      const inn = client.inn?.toLowerCase() || '';
      return phone.includes(search) || name.includes(search) || inn.includes(search);
    });
  }, [clients, searchText]);

  useEffect(() => {
    if (!visible) {
      setSearchText('');
    }
  }, [visible]);

  return (
    <Modal
      title={
        <Space direction="vertical" style={{ width: '100%' }}>
          <span>Выберите клиента</span>
          <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-secondary)' }}>
            Всего клиентов: {totalCount}
          </span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width="90%"
      style={{ maxWidth: 500 }}
    >
      <Input
        placeholder="Поиск по телефону, имени или ИНН..."
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      
      <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        <Spin spinning={loading}>
          <List
            dataSource={filteredClients}
            locale={{ emptyText: <Empty description="Клиенты не найдены" /> }}
            renderItem={(client) => (
              <List.Item
                style={{ cursor: 'pointer' }}
                onClick={() => onSelect(client)}
                className="select-modal-item"
              >
            <List.Item.Meta
              avatar={<PhoneOutlined style={{ fontSize: '20px', color: 'var(--primary-color)' }} />}
              title={
                <Space direction="vertical" size={0}>
                  <span>{client.name || 'Без имени'}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {client.phone || 'Нет телефона'}
                  </span>
                </Space>
              }
              description={
                <Space size={4}>
                  {client.phone_code && (
                    <span style={{ fontSize: '11px' }}>{client.phone_code}</span>
                  )}
                  {client.inn && (
                    <span style={{ fontSize: '11px' }}>ИНН: {client.inn}</span>
                  )}
                  {client.email && (
                    <span style={{ fontSize: '11px' }}>{client.email}</span>
                  )}
                </Space>
              }
            />
              </List.Item>
            )}
          />
        </Spin>
        
        {hasMore && onLoadMore && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button onClick={onLoadMore} loading={loading}>
              Загрузить еще
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ClientSelectModal;

