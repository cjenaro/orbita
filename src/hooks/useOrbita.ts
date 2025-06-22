import { useContext } from 'preact/hooks';
import { OrbitaContext } from '../context';

export function useOrbita() {
  const context = useContext(OrbitaContext);
  
  if (!context) {
    throw new Error('useOrbita must be used within an Orbita app');
  }
  
  return context;
}