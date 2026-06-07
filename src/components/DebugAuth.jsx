import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';

const DebugAuth = () => {
    const [log, setLog] = useState([]);

    const runTest = async () => {
        setLog([...log, 'Starting test...']);
        try {
            setLog(prev => [...prev, 'Calling POST /auth/register...']);
            const res = await axiosClient.post('/auth/register', {
                fullName: 'ReactTester',
                email: 'react@test.com',
                password: 'React@123',
                role: 'Student'
            });
            setLog(prev => [...prev, `Success: ${JSON.stringify(res.data)}`]);
        } catch (err) {
            setLog(prev => [...prev, `Error Object: ${err.message}`]);
            if (err.response) {
                setLog(prev => [...prev, `Error Response Data: ${JSON.stringify(err.response.data)}`]);
                setLog(prev => [...prev, `Error Status: ${err.response.status}`]);
            } else {
                setLog(prev => [...prev, `No Response. Network Error or CORS.`]);
            }
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: 'black', color: 'lime', padding: 20, zIndex: 9999 }}>
            <h2>Auth Debugger</h2>
            <button onClick={runTest} style={{ background: 'white', color: 'black', padding: 10 }}>Run Register Test</button>
            <pre>{log.join('\n')}</pre>
        </div>
    );
};

export default DebugAuth;
