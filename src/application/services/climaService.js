import axios from 'axios';
import https from 'https';
import clima from '../entities/clima.js';

const agent = new https.Agent({ rejectUnauthorized: process.env.NODE_ENV === 'production' });

export default class climaService {
    constructor() {}

    async fetchWeatherAsync(latitude, longitude) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
        const { data } = await axios.get(url, { httpsAgent: agent });
        return data;
    }

    async getWeatherByCoordsAsync(latitude, longitude) {
        const weatherData = await this.fetchWeatherAsync(latitude, longitude);
        const current = weatherData?.current_weather ?? null;
        return {
            latitude,
            longitude,
            temperature: current?.temperature ?? null,
            weather_code: current?.weathercode ?? null,
            weather: current,
        };
    }

    async getUserInfoAsync() {
        const { data } = await axios.get('https://ipapi.co/json/', { httpsAgent: agent });
        const latitude = data.latitude ?? data.lat;
        const longitude = data.longitude ?? data.lon;
        if (!latitude || !longitude) throw new Error('No se pudo obtener ubicación desde ipapi.co');

        const weather = await this.getWeatherByCoordsAsync(latitude, longitude);

        return new clima(
            data.ip,
            data.city,
            data.region,
            data.country,
            data.country_name ?? data.country,
            data.country_code ?? data.country,
            Number(latitude),
            Number(longitude),
            weather.temperature,
            null,
            weather.weather_code,
            null,
            weather.weather,
            null
        );
    }

    async getWeatherByCountryAsync(country) {
        if (!country || !String(country).trim()) throw new Error('El parámetro country es obligatorio');

        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(String(country).trim())}&count=1&language=en&format=json`;
        const { data } = await axios.get(geoUrl, { httpsAgent: agent });

        const result = data?.results?.[0];
        if (!result) throw new Error(`No se encontró el país: ${country}`);

        return this.getWeatherByCoordsAsync(result.latitude, result.longitude);
    }
}
