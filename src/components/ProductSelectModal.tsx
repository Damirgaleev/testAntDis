import { Modal, List, Input, Empty, Tag, Space, Spin, Button } from 'antd';
import { SearchOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useState, useMemo, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  code?: string;
  price: number;
  unit_name?: string;
  stock?: number;
  prices?: Array<{ price: number; price_type: string }>;
  balances?: Array<{ warehouse_name: string; current_amount: number }>;
  type?: string;
}

interface ProductSelectModalProps {
  visible: boolean;
  products: Product[];
  loading: boolean;
  totalCount: number;
  onSelect: (product: Product) => void;
  onCancel: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  selectedItemIds?: string[]; // Добавлен проп для ID уже выбранных товаров
}

const ProductSelectModal: React.FC<ProductSelectModalProps> = ({
  visible,
  products,
  loading,
  totalCount,
  onSelect,
  onCancel,
  onLoadMore,
  hasMore = false,
  selectedItemIds = [], // Значение по умолчанию - пустой массив
}) => {
  const [searchText, setSearchText] = useState('');

  const filteredProducts = useMemo(() => {
    // Сначала фильтруем по уже выбранным товарам
    let availableProducts = products.filter(
      (product) => !selectedItemIds.includes(product.id)
    );
    
    // Затем фильтруем по поисковому запросу
    if (!searchText) return availableProducts;
    const search = searchText.toLowerCase();
    return availableProducts.filter((product) => {
      const name = product.name?.toLowerCase() || '';
      const code = product.code?.toLowerCase() || '';
      return name.includes(search) || code.includes(search);
    });
  }, [products, searchText, selectedItemIds]);

  useEffect(() => {
    if (!visible) {
      setSearchText('');
    }
  }, [visible]);

  return (
    <Modal
      title={
        <Space direction="vertical" style={{ width: '100%' }}>
          <span>Выберите товар</span>
          <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-secondary)' }}>
            Всего товаров: {totalCount}
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
        placeholder="Поиск по названию или коду..."
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ marginBottom: 16 }}
        disabled={loading}
      />
      
      <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        <Spin spinning={loading}>
          <List
            dataSource={filteredProducts}
            locale={{ emptyText: <Empty description="Товары не найдены" /> }}
            renderItem={(product) => (
              <List.Item
                style={{ cursor: 'pointer' }}
                onClick={() => onSelect(product)}
                className="select-modal-item"
              >
                <List.Item.Meta
                  avatar={<ShoppingOutlined style={{ fontSize: '20px', color: 'var(--primary-color)' }} />}
                  title={
                    <Space>
                      <span>{product.name}</span>
                      {product.code && (
                        <Tag color="blue">{product.code}</Tag>
                      )}
                    </Space>
                  }
                  description={
                    <Space>
                      <span style={{ fontWeight: 'bold', color: '#722ed1' }}>
                        {product.price.toFixed(2)} ₽
                      </span>
                      {product.unit_name && <span>/ {product.unit_name}</span>}
                      {product.stock !== undefined && (
                        <span style={{ color: '#8c8c8c' }}>
                          Остаток: {product.stock}
                        </span>
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

export default ProductSelectModal;

