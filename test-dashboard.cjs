const axios = require('axios');
const fs = require('fs');

const api = axios.create({
    baseURL: 'http://localhost:5130/api',
    headers: { 'Content-Type': 'application/json' },
});

async function runTest() {
    try {
        // 1. Register a Student
        const studentEmail = `student${Date.now()}@test.com`;
        await api.post('/auth/register', {
            fullName: 'Test Student',
            email: studentEmail,
            password: 'Password123!',
            role: 'Student'
        });

        // 2. Register an Admin
        const adminEmail = `admin${Date.now()}@test.com`;
        await api.post('/auth/register', {
            fullName: 'Test Admin',
            email: adminEmail,
            password: 'Password123!',
            role: 'Admin'
        });

        // 3. Login as Admin
        const adminLoginRes = await api.post('/auth/login', { email: adminEmail, password: 'Password123!' });
        const adminToken = adminLoginRes.data.token;
        const adminConfig = { headers: { Authorization: `Bearer ${adminToken}` } };

        // 4. Login as Student
        const studentLoginRes = await api.post('/auth/login', { email: studentEmail, password: 'Password123!' });
        const studentToken = studentLoginRes.data.token;
        const studentConfig = { headers: { Authorization: `Bearer ${studentToken}` } };

        // 5. Check Dashboard Before Leave
        const statsBefore = await api.get('/dashboard/today-stats', adminConfig);
        console.log('--- Stats Before Leave ---');
        console.log(statsBefore.data);

        // 6. Request Leave as Student (for Today and Tomorrow) Skip Breakfast and Dinner, eat Lunch
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const leaveRes = await api.post('/leave', {
            startDate: today.toISOString(),
            endDate: tomorrow.toISOString(),
            reason: 'Going home',
            breakfastLeave: true,
            lunchLeave: false,
            dinnerLeave: true
        }, studentConfig);

        const leaveId = leaveRes.data.leaveId || leaveRes.data.id;

        // 7. Approve Leave as Admin
        await api.put(`/leave/${leaveId}/status`, '"Approved"', adminConfig);

        // 8. Check Dashboard After Leave (Today)
        const statsAfterToday = await api.get('/dashboard/today-stats', adminConfig);
        console.log('\n--- Stats After Leave Approved (Today) ---');
        console.log(statsAfterToday.data);
        console.log('Breakfast Expected: ', statsAfterToday.data.expectedBreakfast);
        console.log('Lunch Expected: ', statsAfterToday.data.expectedLunch);
        console.log('Dinner Expected: ', statsAfterToday.data.expectedDinner);

        // 9. Check Dashboard for Next Week (Leave expired)
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        const statsAfterNextWeek = await api.get(`/dashboard/today-stats?date=${nextWeek.toISOString()}`, adminConfig);
        console.log('\n--- Stats Next Week (Leave passed) ---');
        console.log(statsAfterNextWeek.data);

    } catch (e) {
        console.error("Test Failed!", e.response?.data || e.message);
    }
}

runTest();
