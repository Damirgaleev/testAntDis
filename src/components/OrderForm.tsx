import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  Typography,
  Divider,
  Table,
  InputNumber,
  message,
  Tooltip,
  Alert,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons';
import { useTheme } from '../contexts/ThemeContext';
import SelectModal from './SelectModal';
import ProductSelectModal from './ProductSelectModal';
import ClientSelectModal from './ClientSelectModal';
import './OrderForm.css';

import apiClient, { setAuthToken } from '../api/axios';

const { Title, Text } = Typography;

interface OrderFormProps {}

interface Product {
  id: string;
  name: string;
  code?: string;
  price: number;
  unit?: number; // ID единицы измерения
  unit_name?: string;
  stock?: number;
  prices?: { price: number; price_type: string }[];
  balances?: { warehouse_name: string; current_amount: number }[];
  type?: string;
}

interface SelectedItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  unit?: number; // ID единицы измерения
}

interface Account {
  id: string;
  name: string;
  number?: string;
}

interface Organization {
  id: string;
  name: string;
  short_name?: string;
  inn?: string;
  type?: string;
  org_type?: string;
}

interface Warehouse {
  id: string;
  name: string;
  address?: string;
  type?: string;
  description?: string;
  phone?: string;
}

interface PriceType {
  id: string;
  name: string;
  tags?: string[];
}

interface Client {
  id: number;
  name: string;
  phone: string;
  phone_code?: string;
  inn?: string;
  email?: string;
}

interface LoyaltyCard {
  id: number;
  card_number: number;
  balance: number;
  contragent_id: number;
  cashback_percent: number;
  status_card: boolean;
}

const OrderForm: React.FC<OrderFormProps> = () => {
  const { theme, toggleTheme } = useTheme();
  const [form] = Form.useForm();
  const [token, setToken] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loyaltyCard, setLoyaltyCard] = useState<LoyaltyCard | null>(null);
  const [loyaltyCardChecked, setLoyaltyCardChecked] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [selectedPriceType, setSelectedPriceType] = useState<PriceType | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [organizationModalVisible, setOrganizationModalVisible] = useState(false);
  const [warehouseModalVisible, setWarehouseModalVisible] = useState(false);
  const [priceTypeModalVisible, setPriceTypeModalVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [clientModalVisible, setClientModalVisible] = useState(false);
  
  // Состояние для клиентов
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [totalClientsCount, setTotalClientsCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(100);

  // Состояние для счетов (payboxes)
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);

  // Состояние для организаций
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);

  // Состояние для складов
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);

  // Состояние для типов цен
  const [priceTypes, setPriceTypes] = useState<PriceType[]>([]);
  const [priceTypesLoading, setPriceTypesLoading] = useState(false);

  // Состояние для товаров
  const [products, setProducts] = useState<Array<{
    id: string;
    name: string;
    code?: string;
    price: number;
    unit_name?: string;
    stock?: number;
    prices?: Array<{ price: number; price_type: string }>;
    balances?: Array<{ warehouse_name: string; current_amount: number }>;
    type?: string;
  }>>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const [currentProductPage, setCurrentProductPage] = useState(1);
	
	useEffect(() => {
		console.log('Токен:', token);
		if (token) {
			console.log('Устанавливаем токен:', token);
      setAuthToken(token);
    } else {
      setAuthToken(null);
    }
  }, [token]);

  const fetchClients = async (page: number = 1, append: boolean = false) => {
    setClientsLoading(true);
    try {
      const offset = (page - 1) * limit;
      const response = await apiClient.get('/contragents/', {
        params: {
          limit: limit,
          offset: offset,
        }
			});
			
			console.log('Ответ:', response);
      
      if (response.data) {
        setTotalClientsCount(response.data.count || 0);
        if (append) {
          setClients(prev => [...prev, ...(response.data.result || [])]);
        } else {
          setClients(response.data.result || []);
        }
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Ошибка при загрузке клиентов:', error);
    } finally {
      setClientsLoading(false);
    }
  };

  const checkToken = () => {
    if (!token) {
      message.warning('Сначала введите токен авторизации');
      return false;
    }
    return true;
  };

  const handleSearchClient = async () => {
    if (!checkToken()) return;
    // Открываем модальное окно и загружаем клиентов
    setClientModalVisible(true);
    if (clients.length === 0) {
      await fetchClients(1);
    }
  };

  const handleLoadMoreClients = async () => {
    const nextPage = currentPage + 1;
    await fetchClients(nextPage, true);
  };

  const checkLoyaltyCard = async (contragentId: number) => {
    try {
      const response = await apiClient.get('/loyality_cards/', {
        params: {
          contragent_id: contragentId,
        }
      });
      
      console.log('Карты лояльности:', response);
      
      if (response.data && response.data.result && response.data.result.length > 0) {
        // Нашли карту лояльности
        const card = response.data.result[0];
        setLoyaltyCard(card);
        setLoyaltyCardChecked(true);
      } else {
        // Карты нет
        setLoyaltyCard(null);
        setLoyaltyCardChecked(true);
      }
    } catch (error) {
      console.error('Ошибка при проверке карты лояльности:', error);
      setLoyaltyCard(null);
      setLoyaltyCardChecked(true);
    }
  };

  const handleSelectClient = async (client: Client) => {
    // Вставляем имя клиента вместо телефона
    setClientPhone(client.name || client.phone || '');
    setSelectedClient(client);
    setClientModalVisible(false);
    setLoyaltyCardChecked(false);
    
    // Проверяем карту лояльности
    await checkLoyaltyCard(client.id);
  };

  const fetchAccounts = async () => {
    setAccountsLoading(true);
    try {
      const response = await apiClient.get('/payboxes/');
      console.log('Счета (payboxes):', response);
      
      if (response.data) {
        // API может возвращать массив напрямую или в поле result
        const accountsData = Array.isArray(response.data) 
          ? response.data 
          : (response.data.result || []);
        
        // Преобразуем данные API в нужный формат
        const formattedAccounts = accountsData.map((item: {
          id: number | string;
          name?: string;
          title?: string;
          account_number?: string;
          number?: string;
        }) => ({
          id: String(item.id),
          name: item.name || item.title || 'Без названия',
          number: item.account_number || item.number || '',
        }));
        
        setAccounts(formattedAccounts);
      }
    } catch (error) {
      console.error('Ошибка при загрузке счетов:', error);
    } finally {
      setAccountsLoading(false);
    }
  };

  const handleOpenAccountModal = async () => {
    if (!checkToken()) return;
    setAccountModalVisible(true);
    if (accounts.length === 0) {
      await fetchAccounts();
    }
  };

  const fetchOrganizations = async () => {
    setOrganizationsLoading(true);
    try {
      const response = await apiClient.get('/organizations/');
      console.log('Организации:', response);
      
      if (response.data) {
        // API может возвращать массив напрямую или в поле result
        const organizationsData = Array.isArray(response.data) 
          ? response.data 
          : (response.data.result || []);
        
        // Преобразуем данные API в нужный формат
        const formattedOrganizations = organizationsData.map((item: {
          id: number | string;
          short_name?: string;
          work_name?: string;
          full_name?: string;
          inn?: string;
          type?: string;
          org_type?: string;
        }) => ({
          id: String(item.id),
          name: item.short_name || item.work_name || item.full_name || 'Без названия',
          short_name: item.short_name,
          inn: item.inn || '',
          type: item.type || item.org_type || '',
        }));
        
        setOrganizations(formattedOrganizations);
      }
    } catch (error) {
      console.error('Ошибка при загрузке организаций:', error);
    } finally {
      setOrganizationsLoading(false);
    }
  };

  const handleOpenOrganizationModal = async () => {
    if (!checkToken()) return;
    setOrganizationModalVisible(true);
    if (organizations.length === 0) {
      await fetchOrganizations();
    }
  };

  const fetchWarehouses = async () => {
    setWarehousesLoading(true);
    try {
      const response = await apiClient.get('/warehouses/');
      console.log('Склады:', response);
      
      if (response.data) {
        // API возвращает объект с result и count
        const warehousesData = response.data.result || [];
        
        // Преобразуем данные API в нужный формат
        const formattedWarehouses = warehousesData.map((item: {
          id: number | string;
          name?: string;
          address?: string;
          type?: string;
          description?: string;
          phone?: string;
        }) => ({
          id: String(item.id),
          name: item.name || 'Без названия',
          address: item.address || '',
          type: item.type || '',
          description: item.description || '',
          phone: item.phone || '',
        }));
        
        setWarehouses(formattedWarehouses);
      }
    } catch (error) {
      console.error('Ошибка при загрузке складов:', error);
    } finally {
      setWarehousesLoading(false);
    }
  };

  const handleOpenWarehouseModal = async () => {
    if (!checkToken()) return;
    setWarehouseModalVisible(true);
    if (warehouses.length === 0) {
      await fetchWarehouses();
    }
  };

  const fetchPriceTypes = async () => {
    setPriceTypesLoading(true);
    try {
      const response = await apiClient.get('/price_types/');
      console.log('Типы цен:', response);
      
      if (response.data) {
        // API возвращает объект с result и count
        const priceTypesData = response.data.result || [];
        
        // Преобразуем данные API в нужный формат
        const formattedPriceTypes = priceTypesData.map((item: {
          id: number | string;
          name?: string;
          tags?: string[];
        }) => ({
          id: String(item.id),
          name: item.name || 'Без названия',
          tags: item.tags || [],
        }));
        
        setPriceTypes(formattedPriceTypes);
      }
    } catch (error) {
      console.error('Ошибка при загрузке типов цен:', error);
    } finally {
      setPriceTypesLoading(false);
    }
  };

  const handleOpenPriceTypeModal = async () => {
    if (!checkToken()) return;
    setPriceTypeModalVisible(true);
    if (priceTypes.length === 0) {
      await fetchPriceTypes();
    }
  };

  const fetchProducts = async (page: number = 1, append: boolean = false) => {
    setProductsLoading(true);
    try {
      const offset = (page - 1) * limit;
      const response = await apiClient.get('/nomenclature/', {
        params: {
          limit: limit,
          offset: offset,
        }
      });
      
      console.log('Товары:', response);
      
      if (response.data) {
        setTotalProductsCount(response.data.count || 0);
        const productsData = response.data.result || [];
        
        // Преобразуем данные API в нужный формат
        const formattedProducts = productsData.map((item: {
          id: number | string;
          name?: string;
          code?: string;
          unit?: number;
          unit_name?: string;
          type?: string;
          prices?: Array<{ price: number; price_type: string }>;
          balances?: Array<{ warehouse_name: string; current_amount: number }>;
        }) => {
          // Получаем первую цену из массива prices
          const firstPrice = item.prices && item.prices.length > 0 ? item.prices[0].price : 0;
          
          // Получаем общий остаток из balances
          const totalStock = item.balances?.reduce((sum: number, balance: { current_amount: number }) => 
            sum + (balance.current_amount || 0), 0) || 0;
          
          return {
            id: String(item.id),
            name: item.name || 'Без названия',
            code: item.code || '',
            price: firstPrice,
            unit: item.unit,
            unit_name: item.unit_name || '',
            stock: totalStock,
            prices: item.prices || [],
            balances: item.balances || [],
            type: item.type || '',
          };
        });
        
        if (append) {
          setProducts(prev => [...prev, ...formattedProducts]);
        } else {
          setProducts(formattedProducts);
        }
        setCurrentProductPage(page);
      }
    } catch (error) {
      console.error('Ошибка при загрузке товаров:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleOpenProductModal = async () => {
    if (!checkToken()) return;
    setProductModalVisible(true);
    if (products.length === 0) {
      await fetchProducts(1);
    }
  };

  const handleLoadMoreProducts = async () => {
    const nextPage = currentProductPage + 1;
    await fetchProducts(nextPage, true);
  };

  const handleAddItem = (item: Product) => {
    const newItem: SelectedItem = {
      id: item.id,
      name: item.name,
      quantity: 1,
      price: item.price || 0,
      total: item.price || 0,
      unit: item.unit,
    };
    setSelectedItems([...selectedItems, newItem]);
  };

  const handleUpdateItemQuantity = (id: string, quantity: number) => {
    setSelectedItems(selectedItems.map(item => {
      if (item.id === id) {
        const newQuantity = quantity;
        return { ...item, quantity: newQuantity, total: item.price * newQuantity };
      }
      return item;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + item.total, 0);
  };

  const handleCreateSale = async () => {
    if (!checkToken()) return;
    await createSale(false);
  };

  const handleCreateAndPost = async () => {
    if (!checkToken()) return;
    await createSale(true);
  };

  const createSale = async (shouldPost: boolean) => {
    // Проверяем наличие всех обязательных данных
    if (!selectedClient) {
      message.error('Выберите клиента');
      return;
    }
    if (!selectedAccount) {
      message.error('Выберите счет');
      return;
    }
    if (!selectedOrganization) {
      message.error('Выберите организацию');
      return;
    }
    if (!selectedWarehouse) {
      message.error('Выберите склад');
      return;
    }
    if (selectedItems.length === 0) {
      message.error('Добавьте товары');
      return;
    }

    // Формируем массив товаров
    const goods = selectedItems.map(item => ({
      price: item.price,
      quantity: item.quantity,
      unit: item.unit || 116, // Используем unit из товара или 116 по умолчанию
      discount: 0,
      sum_discounted: 0,
      nomenclature: Number(item.id),
    }));

    // Формируем данные для запроса
    const saleData: Record<string, unknown> = {
      priority: 0,
      dated: Math.floor(Date.now() / 1000), // Текущее время в секундах
      operation: 'Заказ',
      tax_included: true,
      tax_active: true,
      goods: goods,
      settings: {},
      warehouse: Number(selectedWarehouse.id),
      contragent: Number(selectedClient.id),
      paybox: Number(selectedAccount.id),
      organization: Number(selectedOrganization.id),
      status: shouldPost, // false для "Создать", true для "Создать и провести"
      paid_rubles: calculateTotal().toFixed(2),
      paid_lt: 0,
    };

    // Добавляем карту лояльности, если она есть
    if (loyaltyCard) {
      saleData.loyality_card_id = loyaltyCard.id;
    }

    try {
      console.log('Отправка данных продажи:', saleData);
      const response = await apiClient.post('/docs_sales/', [saleData]);
      console.log('Ответ от сервера:', response.data);
      
      message.success(
        shouldPost ? 'Продажа создана и проведена!' : 'Продажа создана!'
      );
      
      // Очищаем форму после успешного создания
      setSelectedItems([]);
      setClientPhone('');
      setSelectedClient(null);
      setLoyaltyCard(null);
      setLoyaltyCardChecked(false);
      setSelectedAccount(null);
      setSelectedOrganization(null);
      setSelectedWarehouse(null);
      setSelectedPriceType(null);
    } catch (error) {
      console.error('Ошибка при создании продажи:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      message.error(
        errorMessage || 
        'Ошибка при создании продажи. Проверьте данные и попробуйте снова.'
      );
    }
  };

  const columns = [
    {
      title: 'Товар',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Кол-во',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (quantity: number, record: SelectedItem) => (
        <InputNumber
          min={1}
          value={quantity}
          onChange={(value) => handleUpdateItemQuantity(record.id, value || 1)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Цена',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: number) => `${price.toFixed(2)} ₽`,
    },
    {
      title: 'Сумма',
      dataIndex: 'total',
      key: 'total',
      width: 100,
      render: (total: number) => `${total.toFixed(2)} ₽`,
    },
    {
      title: '',
      key: 'action',
      width: 50,
      render: (_: unknown, record: SelectedItem) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveItem(record.id)}
        />
      ),
    },
  ];

  return (
    <div className="order-form-container">
      <Card className="order-form-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={3} className="order-form-title" style={{ margin: 0 }}>
            Оформление заказа
          </Title>
          <Button
            type="text"
            icon={theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
            style={{ 
              color: 'var(--text-primary)',
              fontSize: '18px',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
          />
        </div>

        <Form  form={form} layout="vertical">
          {/* Токен авторизации */}
          <Form.Item
            label="Токен авторизации"
            rules={[{ required: true, message: 'Введите токен' }]}
          >
            <Input.Password
              placeholder="Введите токен кассы"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </Form.Item>

          {/* Поиск клиента */}
          <Form.Item label="Клиент" name="clientPhone">
            <Tooltip title={!token ? 'Сначала введите токен авторизации' : ''}>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder="Введите имя или телефон клиента"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  onPressEnter={handleSearchClient}
                  disabled={!token}
                />
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleSearchClient}
                  disabled={!token}
                >
                  Найти
                </Button>
              </Space.Compact>
            </Tooltip>
          </Form.Item>

          {/* Статус карты лояльности */}
          {loyaltyCardChecked && selectedClient && (
            <Alert
              message={
                loyaltyCard ? (
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Space>
                      <strong>Карта лояльности:</strong>
                      <span>№{loyaltyCard.card_number}</span>
                    </Space>
                    {loyaltyCard.balance !== undefined && (
                      <span>Баланс: {loyaltyCard.balance.toFixed(2)} ₽</span>
                    )}
                    {loyaltyCard.cashback_percent > 0 && (
                      <span>Кэшбэк: {loyaltyCard.cashback_percent}%</span>
                    )}
                  </Space>
                ) : (
                  <span>У клиента нет карты лояльности</span>
                )
              }
              type={loyaltyCard ? 'success' : 'error'}
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Divider />

          {/* Выбор счета */}
          <Form.Item label="Счет" name="account">
            <Tooltip title={!token ? 'Сначала введите токен авторизации' : ''}>
              <div>
                <Button
                  block
                  onClick={handleOpenAccountModal}
                  loading={accountsLoading}
                  disabled={!token}
                  style={{ textAlign: 'left' }}
                >
                  {selectedAccount ? selectedAccount.name : 'Выберите счет'}
                </Button>
              </div>
            </Tooltip>
          </Form.Item>

          {/* Выбор организации */}
          <Form.Item label="Организация" name="organization">
            <Tooltip title={!token ? 'Сначала введите токен авторизации' : ''}>
              <div>
                <Button
                  block
                  onClick={handleOpenOrganizationModal}
                  loading={organizationsLoading}
                  disabled={!token}
                  style={{ textAlign: 'left' }}
                >
                  {selectedOrganization ? selectedOrganization.name : 'Выберите организацию'}
                </Button>
              </div>
            </Tooltip>
          </Form.Item>

          {/* Выбор склада */}
          <Form.Item label="Склад" name="warehouse">
            <Tooltip title={!token ? 'Сначала введите токен авторизации' : ''}>
              <div>
                <Button
                  block
                  onClick={handleOpenWarehouseModal}
                  loading={warehousesLoading}
                  disabled={!token}
                  style={{ textAlign: 'left' }}
                >
                  {selectedWarehouse ? selectedWarehouse.name : 'Выберите склад'}
                </Button>
              </div>
            </Tooltip>
          </Form.Item>

          {/* Выбор типа цены */}
          <Form.Item label="Тип цены" name="priceType">
            <Tooltip title={!token ? 'Сначала введите токен авторизации' : ''}>
              <div>
                <Button
                  block
                  onClick={handleOpenPriceTypeModal}
                  loading={priceTypesLoading}
                  disabled={!token}
                  style={{ textAlign: 'left' }}
                >
                  {selectedPriceType ? selectedPriceType.name : 'Выберите тип цены'}
                </Button>
              </div>
            </Tooltip>
          </Form.Item>

          <Divider />

          {/* Товары */}
          <Form.Item label="Товары">
            <Tooltip title={!token ? 'Сначала введите токен авторизации' : ''}>
              <div>
                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={handleOpenProductModal}
                  loading={productsLoading}
                  disabled={!token}
                >
                  Добавить товар
                </Button>
              </div>
            </Tooltip>
          </Form.Item>

          {selectedItems.length > 0 && (
            <div className="items-table-container">
              <Table
                dataSource={selectedItems}
                columns={columns}
                rowKey="id"
                pagination={false}
                size="small"
                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3}>
                        <Text strong>Итого:</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <Text strong>{calculateTotal().toFixed(2)} ₽</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} />
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </div>
          )}

          <Divider />

          {/* Кнопки действий */}
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Button
              type="default"
              block
              size="large"
              onClick={handleCreateSale}
              disabled={!token || selectedItems.length === 0}
            >
              Создать продажу
            </Button>
            <Button
              type="primary"
              block
              size="large"
              onClick={handleCreateAndPost}
              disabled={!token || selectedItems.length === 0}
            >
              Создать и провести
            </Button>
          </Space>
        </Form>
      </Card>

      {/* Модальные окна */}
      <SelectModal
        visible={accountModalVisible}
        title="Выберите счет"
        data={accounts.length > 0 ? accounts : []}
        loading={accountsLoading}
        onSelect={(item) => {
          setSelectedAccount(item);
          setAccountModalVisible(false);
        }}
        onCancel={() => setAccountModalVisible(false)}
        displayField="name"
        descriptionField="number"
      />

      <SelectModal
        visible={organizationModalVisible}
        title="Выберите организацию"
        data={organizations.length > 0 ? organizations : []}
        loading={organizationsLoading}
        onSelect={(item) => {
          setSelectedOrganization(item);
          setOrganizationModalVisible(false);
        }}
        onCancel={() => setOrganizationModalVisible(false)}
        displayField="name"
        descriptionField="inn"
      />

      <SelectModal
        visible={warehouseModalVisible}
        title="Выберите склад"
        data={warehouses.length > 0 ? warehouses : []}
        loading={warehousesLoading}
        onSelect={(item) => {
          setSelectedWarehouse(item);
          setWarehouseModalVisible(false);
        }}
        onCancel={() => setWarehouseModalVisible(false)}
        displayField="name"
        descriptionField="address"
      />

      <SelectModal
        visible={priceTypeModalVisible}
        title="Выберите тип цены"
        data={priceTypes.length > 0 ? priceTypes : []}
        loading={priceTypesLoading}
        onSelect={(item) => {
          setSelectedPriceType(item);
          setPriceTypeModalVisible(false);
        }}
        onCancel={() => setPriceTypeModalVisible(false)}
        displayField="name"
      />

      <ProductSelectModal
        visible={productModalVisible}
        products={products}
        loading={productsLoading}
        totalCount={totalProductsCount}
        onSelect={handleAddItem}
        onCancel={() => setProductModalVisible(false)}
        onLoadMore={handleLoadMoreProducts}
        hasMore={products.length < totalProductsCount}
        selectedItemIds={selectedItems.map(item => item.id)}
      />

      <ClientSelectModal
        visible={clientModalVisible}
        clients={clients}
        loading={clientsLoading}
        totalCount={totalClientsCount}
        onSelect={handleSelectClient}
        onCancel={() => setClientModalVisible(false)}
        onLoadMore={handleLoadMoreClients}
        hasMore={clients.length < totalClientsCount}
      />
    </div>
  );
};

export default OrderForm;

