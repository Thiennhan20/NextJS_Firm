'use client';
import { useState } from 'react';

export default function AdminTestPage() {
  const [result, setResult] = useState<string>('');

  const checkAdmin = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/auth/admin-only', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.message);
      } else {
        setResult(data.message || 'Không phải admin!');
      }
    } catch {
      setResult('Lỗi kết nối server');
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <h2>Kiểm tra quyền Admin</h2>
      <button onClick={checkAdmin}>Kiểm tra</button>
      <div style={{ marginTop: 16, color: 'blue' }}>{result}</div>
    </div>
  );
} 