import axios from 'axios';
import https from 'https';
import currency from '../entities/currency.js';

const agent = new https.Agent({ rejectUnauthorized: process.env.NODE_ENV === 'production' });

export default class currencyService {
    constructor() {
        this.apiKey = process.env.CURRENCY_API_KEY;
        this.apiSecret = process.env.CURRENCY_API_SECRET;
    }

    async getCurrencyByCountryAsync(country) {
        const apiKey = process.env.REST_COUNTRIES_KEY;
        if (!apiKey) throw new Error('API key de REST Countries no configurada');

        const normalized = String(country).trim();
        const url = `https://api.restcountries.com/countries/v5/names.common/${encodeURIComponent(normalized)}`;
        const { data } = await axios.get(url, {
            httpsAgent: agent,
            headers: { Authorization: `Bearer ${apiKey}` },
        });

        const item = data?.data?.objects?.[0];
        if (!item?.currencies) throw new Error(`No se encontró moneda para: ${country}`);

        const code = Object.keys(item.currencies)[0];
        const info = item.currencies[code];

        return {
            country: item.names?.common ?? country,
            country_code: item.codes?.alpha_2 ?? '',
            currency_code: code,
            currency_name: info?.name ?? '',
            currency_symbol: info?.symbol ?? '',
            flag: item.flag?.emoji ?? '',
            region: item.region ?? '',
        };
    }

    validateConversionParams(fromCurrency, toCurrency, amount) {
        if (!fromCurrency || !toCurrency) throw new Error('Debe indicar las monedas origen y destino');
        const amountNumber = Number(amount);
        if (Number.isNaN(amountNumber) || amountNumber <= 0) throw new Error('El monto debe ser un número mayor a cero');
        return amountNumber;
    }

    normalizeCurrency(currency) {
        return currency.toString().trim().toUpperCase();
    }

    async convertWithApilayer(from, to, amountNumber) {
        const config = {
            baseURL: 'https://api.apilayer.com/exchangerates_data',
            headers: this.apiKey ? { apikey: this.apiKey } : {},
            httpsAgent: agent,
        };
        const { data } = await axios.create(config).get('/convert', {
            params: { from, to, amount: amountNumber },
        });
        const rate = data?.info?.rate ?? null;
        const converted = data?.result;
        if (!rate || converted == null) throw new Error('No se pudo obtener la conversión desde Apilayer');
        return new currency(from, to, amountNumber, rate, converted, data.date ?? null, 'apilayer');
    }

    async convertWithExchangeRateHost(from, to, amountNumber) {
        const { data } = await axios.get(`https://open.er-api.com/v6/latest/${from}`, { httpsAgent: agent });
        const rate = data?.rates?.[to] ?? null;
        const converted = rate != null ? amountNumber * rate : null;
        const date = data?.time_last_update_utc ?? null;
        if (!rate || converted == null) throw new Error('No se pudo obtener la conversión desde open.er-api.com');
        return new currency(from, to, amountNumber, rate, converted, date, 'open.er-api.com');
    }

    async convertAsync(fromCurrency, toCurrency, amount) {
        const amountNumber = this.validateConversionParams(fromCurrency, toCurrency, amount);
        const from = this.normalizeCurrency(fromCurrency);
        const to = this.normalizeCurrency(toCurrency);

        if (this.apiKey) {
            try {
                return await this.convertWithApilayer(from, to, amountNumber);
            } catch (error) {
                return await this.convertWithExchangeRateHost(from, to, amountNumber);
            }
        }

        return await this.convertWithExchangeRateHost(from, to, amountNumber);
    }
}
