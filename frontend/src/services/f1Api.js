import axios from 'axios';

class F1ApiService {
    constructor() {
        this.baseURL = 'https://f1api.dev/api';
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 10000
        });
    }

    // Базовый метод запроса
    async makeRequest(endpoint) {
        try {
            console.log(`📡 Запрос: ${endpoint}`);
            const response = await this.client.get(endpoint);
            return response.data;
        } catch (error) {
            console.error(`❌ Ошибка ${endpoint}:`, error.message);
            return null;
        }
    }

    // Основные endpoints
    async getCurrentSeason() {
        return await this.makeRequest('/seasons/current') || { year: 2024 };
    }

    async getDrivers() {
        const data = await this.makeRequest('/drivers');
        return data?.drivers || data || [];
    }

    async getConstructors() {
        const data = await this.makeRequest('/constructors');
        return data?.constructors || data || [];
    }

    async getCircuits() {
        const data = await this.makeRequest('/circuits');
        return data?.circuits || data || [];
    }

    async getCalendar(year = 2024) {
        const data = await this.makeRequest(`/calendar/${year}`);
        return data?.races || data || [];
    }

    async getDriverStandings(year = 2024) {
        const data = await this.makeRequest(`/standings/drivers/${year}`);
        return data?.standings || data?.DriverStandings || [];
    }
}

export default new F1ApiService();