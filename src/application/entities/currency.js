export default class currency {
    constructor(fromCurrency, toCurrency, amount, rate, convertedAmount, date, source) {
        this.fromCurrency = fromCurrency;
        this.toCurrency = toCurrency;
        this.amount = amount;
        this.rate = rate;
        this.convertedAmount = convertedAmount;
        this.date = date;
        this.source = source;
    }
}
