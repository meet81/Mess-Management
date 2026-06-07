const axios = require('axios');
const api = axios.create({ baseURL: 'http://localhost:5130/api', headers: { 'Content-Type': 'application/json' } });

async function run() {
    try {
        const loginRes = await api.post('/auth/login', { email: 'test@example.com', password: 'Password123' });
        const token = loginRes.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };

        console.log('--- Submitting Feedback ---');
        const submitRes = await api.post('/feedback', { category: 'Quality', message: 'Test message' }, config);
        console.log(submitRes.data);

        console.log('--- Fetching Feedback ---');
        const fetchRes = await api.get('/feedback/my', config);
        console.log(fetchRes.data);
    } catch (e) {
        console.error('Error:', e.response?.status, e.response?.data || e.message);
    }
}
run();
