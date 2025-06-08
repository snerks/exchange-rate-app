import { useEffect, useState } from 'react';
import { Container, Typography, Box, TextField, MenuItem, CircularProgress, Alert } from '@mui/material';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR'];

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

    useEffect(() => {
        if (base === target) {
            setRate(1);
            return;
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
                if (!(base in rates) || !(target in rates)) {
                    setError('Currency not available in ECB feed.');
                    setRate(null);
                } else {
                    // All rates are relative to EUR
                    // To convert base -> target: (rate_target / rate_base)
                    const eurToBase = rates[base];
                    const eurToTarget = rates[target];
                    setRate(eurToTarget / eurToBase);
                }
                setLoading(false);
            })
            .catch(() => {
                setError('Could not fetch exchange rate.');
                setLoading(false);
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
                    <Typography variant="h5">
                        1 {base} = {rate} {target}
                    </Typography>
                ) : null}
            </Box>
        </Container>
    );
}
