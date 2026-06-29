const countryUtcOffset = {
    // América
    AR: -10800, BO: -14400, BR: -10800, CL: -10800, CO: -18000, CR: -21600,
    CU: -18000, DO: -14400, EC: -18000, SV: -21600, GT: -21600, HN: -21600,
    MX: -21600, NI: -21600, PA: -18000, PY: -14400, PE: -18000, UY: -10800,
    VE: -14400, US: -18000, CA: -18000,

    // Europa
    ES: 3600, FR: 3600, DE: 3600, IT: 3600, PT: 0, GB: 0, IE: 0, NL: 3600,
    BE: 3600, CH: 3600, AT: 3600, DK: 3600, SE: 3600, NO: 3600, FI: 7200,
    PL: 3600, CZ: 3600, SK: 3600, HU: 3600, RO: 7200, BG: 7200, GR: 7200,
    TR: 10800, RU: 10800, UA: 7200, HR: 3600, RS: 3600, BA: 3600, SI: 3600,

    // Asia
    CN: 28800, JP: 32400, KR: 32400, IN: 19800, ID: 25200, TH: 25200,
    VN: 25200, PH: 28800, MY: 28800, SG: 28800, HK: 28800, TW: 28800,
    AE: 14400, SA: 10800, IQ: 10800, IR: 12600, IL: 7200, JO: 7200,
    LB: 7200, KW: 10800, QA: 10800, OM: 14400, YE: 10800, SY: 7200,
    AF: 16200, PK: 18000, BD: 21600, LK: 19800, NP: 20700, MM: 23400,
    KZ: 18000, UZ: 18000, MN: 28800,

    // África
    ZA: 7200, EG: 7200, NG: 3600, KE: 10800, ET: 10800, TZ: 10800,
    GH: 0, CI: 0, SN: 0, CM: 3600, AO: 3600, DZ: 3600, MA: 3600,
    TN: 3600, LY: 7200, SD: 7200, UG: 10800, ZM: 7200, ZW: 7200,
    MZ: 7200, NA: 7200, BW: 7200, MW: 7200,

    // Oceanía
    AU: 39600, NZ: 43200, FJ: 43200, PG: 36000, SB: 39600, VU: 39600,
    WS: 46800, TO: 46800,
};

export function getUtcOffset(countryCode) {
    if (!countryCode) return 0;
    return countryUtcOffset[countryCode.toUpperCase()] ?? 0;
}

export default countryUtcOffset;
