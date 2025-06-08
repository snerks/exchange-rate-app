import { useEffect, useState } from 'react';
import { Container, Typography, Box, TextField, MenuItem, CircularProgress, Alert } from '@mui/material';
// Vite import for raw XML file
import eurofxrefXml from './data/eurofxref-daily.xml?raw';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR'];

const CURRENCY_NAMES: Record<string, string> = {
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    JPY: 'Japanese Yen',
    AUD: 'Australian Dollar',
    CAD: 'Canadian Dollar',
    CHF: 'Swiss Franc',
    CNY: 'Chinese Yuan',
    INR: 'Indian Rupee',
};

// Helper to parse ECB XML and extract rates
function parseEcbRates(xml: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const cubes = Array.from(doc.querySelectorAll('Cube[currency][rate]'));
    const rates: Record<string, number> = { EUR: 1 };
    cubes.forEach(cube => {
        const currency = cube.getAttribute('currency');
        const rate = cube.getAttribute('rate');
        if (currency && rate) {
            rates[currency] = parseFloat(rate);
        }
    });
    return rates;
}

export default function ExchangeRate() {
    const [base, setBase] = useState('USD');
    const [target, setTarget] = useState('EUR');
    const [rate, setRate] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [allRates, setAllRates] = useState<Record<string, number> | null>(null);
    const [dataSource, setDataSource] = useState<'remote' | 'local' | null>(null);

    useEffect(() => {
        setAllRates(null);
        setDataSource(null);
        const isValidEcbXml = (xml: string) => {
            // Basic check: must contain <Cube currency= and <Cube time= (ECB format)
            return (
                typeof xml === 'string' &&
                xml.includes('<Cube') &&
                xml.includes('currency=') &&
                xml.includes('rate=') &&
                xml.includes('time=')
            );
        };
        const handleRates = (xml: string, isFallback = false) => {
            if (!isValidEcbXml(xml)) {
                if (!isFallback && eurofxrefXml) {
                    setDataSource('local');
                    handleRates(eurofxrefXml, true);
                    return;
                } else {
                    setError('Exchange rate data is not in the expected ECB XML format.');
                    setRate(null);
                    setAllRates(null);
                    setLoading(false);
                    setDataSource(null);
                    return;
                }
            }
            if (isFallback) {
                setDataSource('local');
            } else {
                setDataSource('remote');
            }
            const rates = parseEcbRates(xml);
            if (!(base in rates)) {
                setError('Base currency not available in ECB feed.');
                setRate(null);
                setAllRates(null);
            } else {
                const eurToBase = rates[base];
                const newRates: Record<string, number> = {};
                CURRENCIES.forEach(cur => {
                    if (cur in rates) {
                        newRates[cur] = rates[cur] / eurToBase;
                    } else if (cur === base) {
                        newRates[cur] = 1;
                    } else {
                        newRates[cur] = NaN;
                    }
                });
                setAllRates(newRates);
                setRate(newRates[target]);
            }
            setLoading(false);
        };
        setLoading(true);
        setError('');
        fetch('/ecb-xml')
            .then(async res => {
                if (!res.ok) throw new Error('Failed to fetch');
                const resText = await res.text();
                return resText;
            })
            .then(xml => handleRates(xml, false))
            .catch(() => {
                // Fallback to imported XML data
                if (eurofxrefXml) {
                    setDataSource('local');
                    handleRates(eurofxrefXml, true);
                } else {
                    setError('Could not fetch exchange rate from ECB or local file.');
                    setLoading(false);
                    setAllRates(null);
                    setDataSource(null);
                }
            });
    }, [base, target]);

    return (
        <Container maxWidth="sm" sx={{ mt: 6 }}>
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h4" gutterBottom>
                    Exchange Rate
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Powered by European Central Bank (ECB, EUR as base)
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                    select
                    label="Base Currency"
                    value={base}
                    onChange={e => setBase(e.target.value)}
                    fullWidth
                >
                    {CURRENCIES.map(cur => (
                        <MenuItem key={cur} value={cur}>{cur}</MenuItem>
                    ))}
                </TextField>
                <TextField
                    select
                    label="Target Currency"
                    value={target}
                    onChange={e => setTarget(e.target.value)}
                    fullWidth
                >
                    {CURRENCIES.map(cur => (
                        <MenuItem key={cur} value={cur}>{cur}</MenuItem>
                    ))}
                </TextField>
            </Box>
            <Box sx={{ mb: 1 }}>
                {dataSource === 'remote' && (
                    <Alert severity="success" sx={{ mb: 1 }}>
                        Data fetched from European Central Bank (remote)
                    </Alert>
                )}
                {dataSource === 'local' && (
                    <Alert severity="warning" sx={{ mb: 1 }}>
                        Fallback: Data loaded from local file
                    </Alert>
                )}
            </Box>
            <Box sx={{ textAlign: 'center', minHeight: 60 }}>
                {loading ? (
                    <CircularProgress />
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : rate !== null ? (
                    <Typography variant="h5" sx={{ mb: 2 }}>
                        1 {base} = {rate} {target}
                    </Typography>
                ) : null}
                {allRates && (
                    <Box sx={{ mt: 2, overflowX: 'auto' }}>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                            All {base} to Target Currencies
                        </Typography>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ borderBottom: '1px solid #ccc', padding: 4, textAlign: 'left' }}>Currency</th>
                                    <th style={{ borderBottom: '1px solid #ccc', padding: 4, textAlign: 'left' }}>Name</th>
                                    <th style={{ borderBottom: '1px solid #ccc', padding: 4, textAlign: 'right' }}>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {CURRENCIES.filter(cur => cur !== base).map(cur => (
                                    <tr key={cur}>
                                        <td style={{ padding: 4 }}>{cur}</td>
                                        <td style={{ padding: 4, textAlign: 'left' }}>{CURRENCY_NAMES[cur] || cur}</td>
                                        <td style={{ padding: 4, textAlign: 'right' }}>
                                            {isNaN(allRates[cur]) ? 'N/A' : allRates[cur].toFixed(6)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Box>
                )}
            </Box>
        </Container>
    );
}
