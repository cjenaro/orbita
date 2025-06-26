import { render, Component } from "preact";
import { OrbitaConfig, OrbitaPage } from "./types";
import { router } from "./router";
import { OrbitaContext } from "./context";

interface AppProps {
  config: OrbitaConfig;
  initialPage: OrbitaPage;
}

interface AppState {
  page: OrbitaPage;
  Component: any;
  loading: boolean;
}

class App extends Component<AppProps, AppState> {
  private handlePopState: () => void;

  constructor(props: AppProps) {
    super(props);

    this.state = {
      page: props.initialPage,
      Component: null,
      loading: false,
    };

    // Bind methods
    this.loadComponent = this.loadComponent.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.handlePopState = () => {
      router.visit(window.location.pathname + window.location.search, {
        replace: true,
        preserveState: true,
      });
    };
  }

  componentDidMount() {
    // Load initial component
    this.loadComponent(this.state.page.component, this.state.page);

    // Set up router
    router.setPageHandler(this.handlePageChange);

    // Handle browser back/forward
    window.addEventListener("popstate", this.handlePopState);
  }

  componentWillUnmount() {
    window.removeEventListener("popstate", this.handlePopState);
  }

  async loadComponent(componentName: string, pageData: OrbitaPage) {
    try {
      this.setState({ loading: true });
      const component = await this.props.config.resolveComponent(componentName);

      // Only update component and page together to prevent prop/component mismatch
      this.setState({
        Component: component,
        page: pageData,
        loading: false,
      });
    } catch (error) {
      console.error("Failed to load component:", componentName, error);
      this.setState({ loading: false });
    }
  }

  handlePageChange(newPage: OrbitaPage) {
    // Don't update page state immediately - wait for component to load
    this.loadComponent(newPage.component, newPage);

    // Update browser history
    if (newPage.url !== window.location.pathname + window.location.search) {
      window.history.pushState({}, "", newPage.url);
    }
  }

  render() {
    const { Component } = this.state;
    const { config } = this.props;

    if (!Component) {
      return config.swapComponent ? (
        <config.swapComponent />
      ) : (
        <div>Loading!</div>
      );
    }

    return (
      <OrbitaContext.Provider
        value={{
          page: this.state.page,
          visit: router.visit.bind(router),
          reload: router.reload.bind(router),
          post: router.post.bind(router),
          put: router.put.bind(router),
          patch: router.patch.bind(router),
          delete: router.delete.bind(router),
        }}
      >
        <Component {...this.state.page.props} />
      </OrbitaContext.Provider>
    );
  }
}
export function createOrbitaApp(element: Element, config: OrbitaConfig) {
  const initialPage = (window as any).__ORBITA_PAGE__ as OrbitaPage;

  if (!initialPage) {
    throw new Error(
      "Orbita page data not found. Make sure the server is rendering the initial page data.",
    );
  }

  render(<App initialPage={initialPage} config={config} />, element);
}
