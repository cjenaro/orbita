import { createContext } from 'preact';
import { OrbitaContext as OrbitaContextType } from './types';

export const OrbitaContext = createContext<OrbitaContextType | null>(null);