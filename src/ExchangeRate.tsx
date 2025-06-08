import { useEffect, useState } from 'react';
import { Container, Typography, Box, TextField, MenuItem, CircularProgress, Alert } from '@mui/material';

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

    useEffect(() => {
        setAllRates(null);
        if (base === target) {
            // Don't return early; still fetch rates for the table
            setRate(1);
        }
        setLoading(true);
        setError('');
        // Use Vite dev server proxy for ECB XML feed
        fetch('/ecb-xml')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.text();
            })
            .then(xml => {
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
            })
            .catch(() => {
                setError('Could not fetch exchange rate.');
                setLoading(false);
                setAllRates(null);
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
