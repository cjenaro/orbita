import { render, h } from 'preact';
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
      loadComponent(page.component, page);
    }, []);

    async function loadComponent(componentName: string, pageData: OrbitaPage) {
      try {
        setLoading(true);
        const Component = await config.resolveComponent(componentName);
        
        // Only update component and page together to prevent prop/component mismatch
        setComponent(() => Component);
        setPage(pageData);
      } catch (error) {
        console.error('Failed to load component:', componentName, error);
      } finally {
        setLoading(false);
      }
    }

    function handlePageChange(newPage: OrbitaPage) {
      // Don't update page state immediately - wait for component to load
      loadComponent(newPage.component, newPage);
      
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

    if (!component) {
      return config.swapComponent ? h(config.swapComponent, {}) : h('div', {}, 'Loading...');
    }

    return h(OrbitaContext.Provider, {
      value: {
        page,
        visit: router.visit.bind(router),
        reload: router.reload.bind(router),
        post: router.post.bind(router),
        put: router.put.bind(router),
        patch: router.patch.bind(router),
        delete: router.delete.bind(router)
      }
    }, h(component, page.props));
  }

  render(h(App, {}), element);
}