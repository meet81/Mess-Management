import axiosClient from '../api/axiosClient';

const paymentService = {
    // Admin: Get all payments
    getAllPayments: async (month, year) => {
        let url = '/payment';
        const params = new URLSearchParams();
        if (month) params.append('month', month);
        if (year) params.append('year', year);
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        const response = await axiosClient.get(url);
        return response.data;
    },

    // Student: Get my payments (or Admin getting specific student)
    getStudentPayments: async (userId) => {
        // If no userId provided, typical student fetches their own
        if (!userId) {
            const response = await axiosClient.get('/payment/my');
            return response.data;
        }
        const response = await axiosClient.get(`/payment/student/${userId}`);
        return response.data;
    },

    // Admin: Generate monthly bills
    generateMonthlyPayment: async (month, year) => {
        const response = await axiosClient.post('/payment/generate', { month, year });
        return response.data;
    },

    // User/Admin: Pay amount
    payAmount: async (paymentId, amount, paymentMethod, transactionId) => {
        const response = await axiosClient.post(`/payment/pay/${paymentId}`, { amount, paymentMethod, transactionId });
        return response.data;
    }
};

export default paymentService;
