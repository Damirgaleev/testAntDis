import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { ThemeProvider } from './contexts/ThemeContext';
import OrderForm from './components/OrderForm';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <ConfigProvider locale={ruRU}>
        <div className="App">
          <OrderForm />
        </div>
      </ConfigProvider>
    </ThemeProvider>
  );
}

export default App;

