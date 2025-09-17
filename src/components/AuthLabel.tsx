import { useEffect, useState } from 'react';

export default function AuthLabel() {
  const [label, setLabel] = useState('Login');

  const refresh = async () => {
    try {
      const res = await fetch('/api/auth/session', { credentials: 'include' });
      const data = await res.json();
      setLabel(data?.signedIn ? 'Logout' : 'Login');
    } catch {
      setLabel('Login');
    }
  };

  useEffect(() => {
    refresh();
    const onSwap = () => refresh();
    document.addEventListener('astro:after-swap', onSwap);
    return () => document.removeEventListener('astro:after-swap', onSwap);
  }, []);

  return (
    <span id='auth-label' className='menu-label mt-1 block text-[10px] leading-3'>
      {label}
    </span>
  );
}
