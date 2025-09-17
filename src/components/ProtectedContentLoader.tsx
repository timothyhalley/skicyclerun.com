import { useEffect } from 'react';
import { marked } from 'marked';

export default function ProtectedContentLoader() {
  useEffect(() => {
    console.log('ProtectedContentLoader mounted.');

    const container = document.getElementById('protected-content-container');
    if (!container) {
      console.error('Could not find #protected-content-container');
      return;
    }

    const slug = window.location.pathname.split('/').pop();
    console.log('Attempting to fetch content for slug:', slug);

    // First, check if user is signed in; if not, AuthGate will show the message
    fetch('/api/auth/session', { credentials: 'include' })
      .then(res => res.json())
      .then(session => {
        if (!session?.signedIn) {
          console.log('User not signed in; skipping protected content fetch.');
          return Promise.reject('unauthenticated');
        }
        return fetch(`/api/content/${slug}`, { credentials: 'include' });
      })
      .then(async response => {
        console.log('API response status:', response.status);

        if (response.status === 401) {
          container.innerHTML =
            '<p>You are not authorized to view this content. Please log in.</p>';
          return;
        }

        if (response.status === 404) {
          container.innerHTML = '<p>Content not found.</p>';
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch content: ${response.statusText}`);
        }

        const mdxContent = await response.text();
        console.log('Successfully fetched content.');
        const parsed = marked.parse(mdxContent);
        if (parsed instanceof Promise) {
          parsed.then(html => {
            container.innerHTML = html;
          });
        } else {
          container.innerHTML = parsed;
        }
      })
      .catch(error => {
        console.error('Error fetching protected content:', error);
        if (String(error) === 'unauthenticated') {
          // AuthGate will show the unauthenticated message; do nothing
          return;
        }
        container.innerHTML = '<p>Sorry, there was an error loading the content.</p>';
      });
  }, []);

  return null;
}
