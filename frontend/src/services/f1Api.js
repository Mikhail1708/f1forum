import axios from 'axios';

class F1ApiService {
    constructor() {
        this.baseURL = 'https://api.jolpi.ca/ergast/f1';
        this.cache = new Map();
        this.cacheTime = 5 * 60 * 1000; // 5 минут кэша
    }

    // Кэширование запросов
    async cachedRequest(cacheKey, requestFn) {
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTime) {
            return cached.data;
        }

        try {
            const data = await requestFn();
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            return data;
        } catch (error) {
            if (cached) {
                console.warn('Используем кэшированные данные из-за ошибки API');
                return cached.data;
            }
            throw error;
        }
    }

    // Базовый метод для API запросов
    async makeRequest(endpoint) {
        try {
            const response = await axios.get(`${this.baseURL}${endpoint}`);
            return response.data.MRData;
        } catch (error) {
            console.error(`API Error for ${endpoint}:`, error);
            throw error;
        }
    }

    // Получение текущего сезона
    async getCurrentSeason() {
        return this.cachedRequest('currentSeason', async () => {
            const data = await this.makeRequest('/current.json');
            return {
                year: parseInt(data.RaceTable.season),
                url: data.url
            };
        });
    }

    // Получение пилотов текущего сезона
    async getDrivers() {
        return this.cachedRequest('drivers', async () => {
            const season = await this.getCurrentSeason();
            const data = await this.makeRequest(`/${season.year}/drivers.json`);
            return data.DriverTable.Drivers;
        });
    }

    // Получение команд
    async getConstructors() {
        return this.cachedRequest('constructors', async () => {
            const season = await this.getCurrentSeason();
            const data = await this.makeRequest(`/${season.year}/constructors.json`);
            return data.ConstructorTable.Constructors;
        });
    }

    // Получение трасс
    async getCircuits() {
        return this.cachedRequest('circuits', async () => {
            const season = await this.getCurrentSeason();
            const data = await this.makeRequest(`/${season.year}/circuits.json`);
            return data.CircuitTable.Circuits;
        });
    }

    // Получение календаря сезона
    async getCalendar(year = null) {
        if (!year) {
            const season = await this.getCurrentSeason();
            year = season.year;
        }
        
        return this.cachedRequest(`calendar-${year}`, async () => {
            const data = await this.makeRequest(`/${year}.json`);
            return data.RaceTable.Races;
        });
    }

    // Получение чемпионата пилотов
    async getDriverStandings(year = null) {
        if (!year) {
            const season = await this.getCurrentSeason();
            year = season.year;
        }
        
        return this.cachedRequest(`driverStandings-${year}`, async () => {
            const data = await this.makeRequest(`/${year}/driverStandings.json`);
            return data.StandingsTable.StandingsLists[0].DriverStandings;
        });
    }

    // Получение чемпионата конструкторов
    async getConstructorStandings(year = null) {
        if (!year) {
            const season = await this.getCurrentSeason();
            year = season.year;
        }
        
        return this.cachedRequest(`constructorStandings-${year}`, async () => {
            const data = await this.makeRequest(`/${year}/constructorStandings.json`);
            return data.StandingsTable.StandingsLists[0].ConstructorStandings;
        });
    }

    // Получение следующей гонки
    async getNextRace() {
        return this.cachedRequest('nextRace', async () => {
            const calendar = await this.getCalendar();
            const now = new Date();
            const upcomingRaces = calendar.filter(race => new Date(race.date) > now);
            return upcomingRaces.length > 0 ? upcomingRaces[0] : null;
        });
    }

    // Получение результатов последней гонки
    async getLastRaceResults() {
        return this.cachedRequest('lastRaceResults', async () => {
            const season = await this.getCurrentSeason();
            const data = await this.makeRequest(`/${season.year}/last/results.json`);
            return data.RaceTable.Races[0]?.Results || [];
        });
    }

    // Получение информации о пилоте
    async getDriverDetails(driverId) {
        return this.cachedRequest(`driver-${driverId}`, async () => {
            const data = await this.makeRequest(`/drivers/${driverId}.json`);
            return data.DriverTable.Drivers[0];
        });
    }

    // Получение информации о команде
    async getConstructorDetails(constructorId) {
        return this.cachedRequest(`constructor-${constructorId}`, async () => {
            const data = await this.makeRequest(`/constructors/${constructorId}.json`);
            return data.ConstructorTable.Constructors[0];
        });
    }

    // Очистка кэша
    clearCache() {
        this.cache.clear();
    }
}

export default new F1ApiService();