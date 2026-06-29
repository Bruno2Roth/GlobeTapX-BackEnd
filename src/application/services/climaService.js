import axios from 'axios';
import https from 'https';

const agent = new https.Agent({ rejectUnauthorized: process.env.NODE_ENV === 'production' });

export default class climaService {
    constructor() {}

    async fetchWeatherAsync(latitude, longitude) {
        const params = new URLSearchParams({
            latitude,
            longitude,
            current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m',
            daily: 'temperature_2m_max,temperature_2m_min,weather_code',
            timezone: 'auto',
        });
        const url = `https://api.open-meteo.com/v1/forecast?${params}`;
        const { data } = await axios.get(url, { httpsAgent: agent });
        return data;
    }

    async getWeatherByCoordsAsync(latitude, longitude, countryName = null, countryCode = null) {
        const weatherData = await this.fetchWeatherAsync(latitude, longitude);
        const utcOffsetSeconds = weatherData.utc_offset_seconds ?? 0;
        const localTime = new Date(Date.now() + utcOffsetSeconds * 1000)
            .toISOString()
            .replace('Z', '');
        const flagUrl = countryCode
            ? `https://flagcdn.com/${countryCode.toLowerCase()}.svg`
            : null;
        return {
            latitude,
            longitude,
            country_name: countryName,
            country_code: countryCode,
            flag_url: flagUrl,
            timezone: weatherData.timezone ?? null,
            timezone_abbreviation: weatherData.timezone_abbreviation ?? null,
            utc_offset_seconds: utcOffsetSeconds,
            local_time: localTime,
            current: weatherData.current ?? null,
            daily: weatherData.daily ?? null,
        };
    }

    async getUserInfoAsync() {
        const { data } = await axios.get('https://ipapi.co/json/', { httpsAgent: agent });
        const latitude = data.latitude ?? data.lat;
        const longitude = data.longitude ?? data.lon;
        if (!latitude || !longitude) throw new Error('No se pudo obtener ubicación desde ipapi.co');

        const weather = await this.getWeatherByCoordsAsync(
            latitude,
            longitude,
            data.country_name ?? data.country,
            data.country_code ?? data.country
        );

        return {
            ip: data.ip,
            city: data.city,
            region: data.region,
            country: data.country,
            country_name: data.country_name ?? data.country,
            country_code: data.country_code ?? data.country,
            flag_url: weather.flag_url,
            latitude: Number(latitude),
            longitude: Number(longitude),
            timezone: weather.timezone,
            timezone_abbreviation: weather.timezone_abbreviation,
            utc_offset_seconds: weather.utc_offset_seconds,
            local_time: weather.local_time,
            current: weather.current,
            daily: weather.daily,
        };
    }

    async getWeatherByCountryAsync(country) {
        if (!country || !String(country).trim()) throw new Error('El parámetro country es obligatorio');

        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(String(country).trim())}&count=1&language=en&format=json`;
        const { data } = await axios.get(geoUrl, { httpsAgent: agent });

        const result = data?.results?.[0];
        if (!result) throw new Error(`No se encontró el país: ${country}`);

        return this.getWeatherByCoordsAsync(
            result.latitude,
            result.longitude,
            result.country ?? String(country).trim(),
            result.country_code ?? null
        );
    }
}
