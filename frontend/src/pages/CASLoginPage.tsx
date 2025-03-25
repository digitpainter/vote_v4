import { Button, Input } from 'antd';
import { useActivity } from '../contexts/ActivityContext';
import { useAuth } from '../contexts/AuthContext';
import React, { useState } from 'react';
export default function CASLoginPage() {
  const { activeActivities, loading, error } = useActivity();
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      await login("");
    } catch (err) {
      console.error('登录失败:', err);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen space-y-8">
      {!loading && !error && activeActivities && activeActivities.length > 0 && (
        <div className="text-3xl font-bold text-gray-800">
          {activeActivities[0].title}
        </div>
      )}
      <Button 
        type="primary"
        size="large"
        onClick={handleLogin}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        去登录
      </Button>
    </div>
  );
}