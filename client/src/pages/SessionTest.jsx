import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const SessionTest = () => {
  const { user, isAuthenticated } = useAuth();
  const [cookies, setCookies] = useState(null);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    testSession();
  }, []);

  const testSession = async () => {
    try {
      const response = await axios.get('/api/test/cookies', {
        withCredentials: true
      });
      setCookies(response.data);
    } catch (error) {
      setCookies({ error: error.message });
    }
  };

  const testProtectedRoute = async () => {
    try {
      const response = await axios.get('/api/auth/me', {
        withCredentials: true
      });
      setTestResult({ success: true, data: response.data });
    } catch (error) {
      setTestResult({ 
        success: false, 
        error: error.response?.data?.message || error.message 
      });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">🔐 Session/Auth Test</h1>

      {/* Auth Context Status */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h2 className="text-xl font-semibold mb-4">Auth Context Status</h2>
        <div className="space-y-2">
          <p><strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
          {user && (
            <>
              <p><strong>User:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <p><strong>Points:</strong> {user.points}</p>
            </>
          )}
        </div>
      </div>

      {/* Cookie Test */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h2 className="text-xl font-semibold mb-4">Server Cookie Check</h2>
        {cookies ? (
          <div className="space-y-2">
            <p><strong>Has Cookies:</strong> {cookies.hasCookies ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Has Token:</strong> {cookies.hasToken ? '✅ Yes' : '❌ No'}</p>
            <details className="mt-4">
              <summary className="cursor-pointer font-semibold">View Raw Data</summary>
              <pre className="mt-2 p-4 bg-gray-50 rounded text-xs overflow-auto">
                {JSON.stringify(cookies, null, 2)}
              </pre>
            </details>
          </div>
        ) : (
          <p>Loading...</p>
        )}
        <button
          onClick={testSession}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh Cookie Test
        </button>
      </div>

      {/* Protected Route Test */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h2 className="text-xl font-semibold mb-4">Protected Route Test</h2>
        {testResult && (
          <div className={`p-4 rounded ${testResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
            {testResult.success ? (
              <>
                <p className="text-green-700 font-semibold mb-2">✅ Success! Token is working</p>
                <details>
                  <summary className="cursor-pointer">View Response</summary>
                  <pre className="mt-2 text-xs overflow-auto">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                </details>
              </>
            ) : (
              <p className="text-red-700">❌ Failed: {testResult.error}</p>
            )}
          </div>
        )}
        <button
          onClick={testProtectedRoute}
          className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          Test Protected Route
        </button>
      </div>

      {/* Browser Cookies Info */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h2 className="text-xl font-semibold mb-4">📝 How to Check Browser Cookies</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Press <code className="bg-blue-100 px-2 py-1 rounded">F12</code></li>
          <li>Go to <strong>Application</strong> tab</li>
          <li>Expand <strong>Cookies</strong> → <strong>http://localhost:5173</strong></li>
          <li>Look for cookie named <code className="bg-blue-100 px-2 py-1 rounded">token</code></li>
          <li>HttpOnly should be ✅ (means JavaScript can't read it - GOOD for security)</li>
        </ol>
        <p className="mt-4 text-sm text-blue-700">
          <strong>Note:</strong> If you don't see the token cookie, it might still be working! 
          HttpOnly cookies are hidden from JavaScript for security.
        </p>
      </div>
    </div>
  );
};

export default SessionTest;
