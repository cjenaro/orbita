import { render } from "preact";
import { useState, useEffect } from "preact/hooks";
import { OrbitaConfig, OrbitaPage } from "./types";
import { router } from "./router";
import { OrbitaContext } from "./context";

export function createOrbitaApp(element: Element, config: OrbitaConfig) {
  const initialPage = (window as any).__ORBITA_PAGE__ as OrbitaPage;

  if (!initialPage) {
    throw new Error(
      "Orbita page data not found. Make sure the server is rendering the initial page data.",
    );
  }

  function App() {
    console.log("APP STARTED", initialPage);
    const [page, setPage] = useState<OrbitaPage>(initialPage);
    console.log("PAGE INIT");
    const [Component, setComponent] = useState<any>(null);
    console.log("COMPONENT INIT");
    const [loading, setLoading] = useState(false);
    console.log("LOADING INIT");

    // Load initial component
    useEffect(() => {
      console.log("INITIAL LOAD COMPONENT CALL");
      loadComponent(page.component, page);
    }, []);

    async function loadComponent(componentName: string, pageData: OrbitaPage) {
      try {
        setLoading(true);
        const component = await config.resolveComponent(componentName);

        // Only update component and page together to prevent prop/component mismatch
        setComponent(() => component);
        setPage(pageData);
      } catch (error) {
        console.error("Failed to load component:", componentName, error);
      } finally {
        setLoading(false);
      }
    }

    function handlePageChange(newPage: OrbitaPage) {
      // Don't update page state immediately - wait for component to load
      loadComponent(newPage.component, newPage);

      // Update browser history
      if (newPage.url !== window.location.pathname + window.location.search) {
        window.history.pushState({}, "", newPage.url);
      }
    }

    // Set up router
    useEffect(() => {
      router.setPageHandler(handlePageChange);

      // Handle browser back/forward
      const handlePopState = () => {
        router.visit(window.location.pathname + window.location.search, {
          replace: true,
          preserveState: true,
        });
      };

      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    if (!Component) {
      console.log("!COMPONENT");
      return config.swapComponent ? (
        <config.swapComponent />
      ) : (
        <div>Loading!</div>
      );
    }

    console.log("!PROVIDER");
    return (
      <OrbitaContext.Provider
        value={{
          page,
          visit: router.visit.bind(router),
          reload: router.reload.bind(router),
          post: router.post.bind(router),
          put: router.put.bind(router),
          patch: router.patch.bind(router),
          delete: router.delete.bind(router),
        }}
      >
        <Component {...page.props} />
      </OrbitaContext.Provider>
    );
  }

  render(<App />, element);
}
