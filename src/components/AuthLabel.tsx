import { useEffect, useState } from 'react';
import { Hub } from 'aws-amplify/utils';
import { getCurrentUser } from 'aws-amplify/auth';

export default function AuthLabel() {
  const [label, setLabel] = useState('Login');

  const refresh = async () => {
    try {
      await getCurrentUser();
      setLabel('Logout');
    } catch {
      setLabel('Login');
    }
  };

  useEffect(() => {
    refresh();
    const sub = Hub.listen('auth', () => refresh());
    return () => {
      try { sub(); } catch {}
    };
  }, []);

  return (
    <span id="auth-label" className="menu-label block text-[10px] leading-3 mt-1">
      {label}
    </span>
  );
}