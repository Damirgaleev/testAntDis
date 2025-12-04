import { Modal, List, Input, Empty, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useState, useMemo } from 'react';

interface SelectModalProps {
  visible: boolean;
  title: string;
  data: any[];
  onSelect: (item: any) => void;
  onCancel: () => void;
  displayField: string;
  descriptionField?: string;
  loading?: boolean;
}

const SelectModal: React.FC<SelectModalProps> = ({
  visible,
  title,
  data,
  onSelect,
  onCancel,
  displayField,
  descriptionField,
  loading = false,
}) => {
  const [searchText, setSearchText] = useState('');

  const filteredData = useMemo(() => {
    if (!searchText) return data;
    return data.filter((item) => {
      const displayValue = item[displayField]?.toLowerCase() || '';
      const descValue = descriptionField ? item[descriptionField]?.toLowerCase() || '' : '';
      const search = searchText.toLowerCase();
      return displayValue.includes(search) || descValue.includes(search);
    });
  }, [data, searchText, displayField, descriptionField]);

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width="90%"
      style={{ maxWidth: 500 }}
    >
      <Input
        placeholder="Поиск..."
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ marginBottom: 16 }}
        disabled={loading}
      />
      <Spin spinning={loading}>
        <List
          dataSource={filteredData}
          locale={{ emptyText: <Empty description="Ничего не найдено" /> }}
          renderItem={(item) => (
            <List.Item
              style={{ cursor: 'pointer' }}
              onClick={() => onSelect(item)}
              className="select-modal-item"
            >
              <List.Item.Meta
                title={item[displayField]}
                description={descriptionField ? item[descriptionField] : null}
              />
            </List.Item>
          )}
        />
      </Spin>
    </Modal>
  );
};

export default SelectModal;

