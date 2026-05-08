import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const error = searchParams.get('error');

      if (error) {
        toast.error('Google login failed. Please try again.');
        navigate('/login');
        return;
      }

      const code = searchParams.get('code');

      if (!code) {
        toast.error('Authentication failed');
        navigate('/login');
        return;
      }

      try {
        // Kodni backendga yuborib, token va user ma'lumotlarini response body dan olamiz
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/exchange`,
          { code }
        );

        const { token, user } = response.data;

        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem('user', JSON.stringify(user));

        toast.success(`Welcome back, ${user.full_name}!`);
        window.location.href = '/dashboard';
      } catch (err) {
        console.error('Error exchanging OAuth code:', err);
        toast.error('Authentication failed');
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Signing you in...</p>
      </div>
    </div>
  );
}

