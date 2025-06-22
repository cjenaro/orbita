import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { OrbitaConfig, OrbitaPage } from './types';
import { router } from './router';
import { OrbitaContext } from './context';

export function createOrbitaApp(element: Element, config: OrbitaConfig) {
  const initialPage = (window as any).__ORBITA_PAGE__ as OrbitaPage;
  
  if (!initialPage) {
    throw new Error('Orbita page data not found. Make sure the server is rendering the initial page data.');
  }

  function App() {
    const [page, setPage] = useState<OrbitaPage>(initialPage);
    const [component, setComponent] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Load initial component
    useEffect(() => {
      loadComponent(page.component);
    }, []);

    // Handle page changes
    useEffect(() => {
      loadComponent(page.component);
    }, [page.component]);

    async function loadComponent(componentName: string) {
      try {
        setLoading(true);
        const Component = await config.resolveComponent(componentName);
        setComponent(() => Component);
      } catch (error) {
        console.error('Failed to load component:', componentName, error);
      } finally {
        setLoading(false);
      }
    }

    function handlePageChange(newPage: OrbitaPage) {
      setPage(newPage);
      
      // Update browser history
      if (newPage.url !== window.location.pathname + window.location.search) {
        window.history.pushState({}, '', newPage.url);
      }
    }

    // Set up router
    useEffect(() => {
      router.setPageHandler(handlePageChange);
      
      // Handle browser back/forward
      const handlePopState = () => {
        router.visit(window.location.pathname + window.location.search, {
          replace: true,
          preserveState: true
        });
      };
      
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    if (loading && !component) {
      return config.swapComponent ? <config.swapComponent /> : <div>Loading...</div>;
    }

    if (!component) {
      return <div>Component not found: {page.component}</div>;
    }

    return (
      <OrbitaContext.Provider value={{
        page,
        visit: router.visit.bind(router),
        reload: router.reload.bind(router),
        post: router.post.bind(router),
        put: router.put.bind(router),
        patch: router.patch.bind(router),
        delete: router.delete.bind(router)
      }}>
        <component {...page.props} />
      </OrbitaContext.Provider>
    );
  }

  render(<App />, element);
}