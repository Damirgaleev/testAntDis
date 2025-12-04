import axios from 'axios';

// Создаем экземпляр axios с базовой конфигурацией
const apiClient = axios.create({
  baseURL: 'https://app.tablecrm.com/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Переменная для хранения текущего токена
let currentToken: string | null = null;

// Функция для установки токена
export const setAuthToken = (token: string | null) => {
  currentToken = token;
};

// Интерцептор для запросов
apiClient.interceptors.request.use(
  (config) => {
    // Добавляем токен из переменной
    if (currentToken) {
      config.params = {
        ...config.params,
        token: currentToken,
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Интерцептор для ответов
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Обработка ошибок
    if (error.response) {
      // Сервер ответил с кодом ошибки
      console.error('Ошибка ответа:', error.response.data);
    } else if (error.request) {
      // Запрос был отправлен, но ответа не получено
      console.error('Ошибка запроса:', error.request);
    } else {
      // Что-то пошло не так при настройке запроса
      console.error('Ошибка:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;