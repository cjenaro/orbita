import { ComponentType } from 'preact';

export interface OrbitaPage {
  component: string;
  props: Record<string, any>;
  url: string;
  version?: string;
}

export interface OrbitaProps {
  initialPage: OrbitaPage;
  resolveComponent: (name: string) => ComponentType<any> | Promise<ComponentType<any>>;
}

export interface OrbitaResponse {
  component: string;
  props: Record<string, any>;
  url: string;
  version?: string;
}

export interface OrbitaConfig {
  resolveComponent: (name: string) => ComponentType<any> | Promise<ComponentType<any>>;
  swapComponent?: ComponentType<any>;
  progressColor?: string;
  progressIncludeCSS?: boolean;
}

export interface OrbitaVisitOptions {
  method?: 'get' | 'post' | 'put' | 'patch' | 'delete';
  data?: Record<string, any>;
  replace?: boolean;
  preserveState?: boolean;
  preserveScroll?: boolean;
  only?: string[];
  headers?: Record<string, string>;
  errorBag?: string;
  forceFormData?: boolean;
  onBefore?: () => boolean | void;
  onStart?: () => void;
  onProgress?: (progress: number) => void;
  onSuccess?: (page: OrbitaPage) => void;
  onError?: (errors: Record<string, string>) => void;
  onFinish?: () => void;
}

export interface OrbitaContext {
  page: OrbitaPage;
  visit: (url: string, options?: OrbitaVisitOptions) => void;
  reload: (options?: Omit<OrbitaVisitOptions, 'method'>) => void;
  post: (url: string, data?: Record<string, any>, options?: Omit<OrbitaVisitOptions, 'method' | 'data'>) => void;
  put: (url: string, data?: Record<string, any>, options?: Omit<OrbitaVisitOptions, 'method' | 'data'>) => void;
  patch: (url: string, data?: Record<string, any>, options?: Omit<OrbitaVisitOptions, 'method' | 'data'>) => void;
  delete: (url: string, options?: Omit<OrbitaVisitOptions, 'method'>) => void;
}