import { OrbitaPage, OrbitaVisitOptions, OrbitaResponse } from './types';

class OrbitaRouter {
  private pageHandler: ((page: OrbitaPage) => void) | null = null;
  private pendingVisit: Promise<any> | null = null;

  setPageHandler(handler: (page: OrbitaPage) => void) {
    this.pageHandler = handler;
  }

  async visit(url: string, options: OrbitaVisitOptions = {}) {
    // Prevent concurrent visits
    if (this.pendingVisit) {
      await this.pendingVisit;
    }

    const {
      method = 'get',
      data = {},
      replace = false,
      preserveState = false,
      preserveScroll = false,
      only = [],
      headers = {},
      onBefore,
      onStart,
      onProgress,
      onSuccess,
      onError,
      onFinish
    } = options;

    // Call onBefore callback
    if (onBefore && onBefore() === false) {
      return;
    }

    // Call onStart callback
    onStart?.();

    try {
      this.pendingVisit = this.makeRequest(url, {
        method,
        data,
        headers: {
          'X-Orbita': 'true',
          'X-Requested-With': 'XMLHttpRequest',
          ...headers,
          ...(only.length > 0 && { 'X-Orbita-Partial-Component': only.join(',') }),
          ...(preserveState && { 'X-Orbita-Preserve-State': 'true' }),
          ...(preserveScroll && { 'X-Orbita-Preserve-Scroll': 'true' })
        },
        onUploadProgress: onProgress
      });

      const response = await this.pendingVisit;
      const page: OrbitaPage = response.data;

      // Update page
      if (this.pageHandler) {
        this.pageHandler(page);
      }

      // Call onSuccess callback
      onSuccess?.(page);

    } catch (error: any) {
      console.error('Orbita visit failed:', error);
      
      if (error.response?.status === 422) {
        // Validation errors
        onError?.(error.response.data.errors || {});
      } else {
        // Other errors - redirect to error page or show generic error
        onError?.({ message: 'An error occurred' });
      }
    } finally {
      this.pendingVisit = null;
      onFinish?.();
    }
  }

  reload(options: Omit<OrbitaVisitOptions, 'method'> = {}) {
    return this.visit(window.location.pathname + window.location.search, {
      ...options,
      preserveState: true,
      preserveScroll: true
    });
  }

  post(url: string, data: Record<string, any> = {}, options: Omit<OrbitaVisitOptions, 'method' | 'data'> = {}) {
    return this.visit(url, { ...options, method: 'post', data });
  }

  put(url: string, data: Record<string, any> = {}, options: Omit<OrbitaVisitOptions, 'method' | 'data'> = {}) {
    return this.visit(url, { ...options, method: 'put', data });
  }

  patch(url: string, data: Record<string, any> = {}, options: Omit<OrbitaVisitOptions, 'method' | 'data'> = {}) {
    return this.visit(url, { ...options, method: 'patch', data });
  }

  delete(url: string, options: Omit<OrbitaVisitOptions, 'method'> = {}) {
    return this.visit(url, { ...options, method: 'delete' });
  }

  private async makeRequest(url: string, config: any) {
    const fetchConfig: RequestInit = {
      method: config.method.toUpperCase(),
      headers: config.headers,
    };

    let requestUrl = url;

    if (config.method === 'get' && config.data && Object.keys(config.data).length > 0) {
      // For GET requests, append data as query parameters
      const params = new URLSearchParams(config.data);
      requestUrl += (url.includes('?') ? '&' : '?') + params.toString();
    } else if (config.data && Object.keys(config.data).length > 0) {
      // For other methods, send data in body
      if (config.data instanceof FormData) {
        fetchConfig.body = config.data;
      } else {
        fetchConfig.headers = {
          ...fetchConfig.headers,
          'Content-Type': 'application/json',
        };
        fetchConfig.body = JSON.stringify(config.data);
      }
    }

    const response = await fetch(requestUrl, fetchConfig);
    
    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`) as any;
      error.response = {
        status: response.status,
        data: response.headers.get('content-type')?.includes('application/json') 
          ? await response.json() 
          : await response.text()
      };
      throw error;
    }

    return {
      data: response.headers.get('content-type')?.includes('application/json') 
        ? await response.json() 
        : await response.text()
    };
  }
}

export const router = new OrbitaRouter();