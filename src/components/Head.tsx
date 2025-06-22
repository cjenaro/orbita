import { ComponentChildren } from 'preact';
import { useEffect } from 'preact/hooks';

interface OrbitaHeadProps {
  title?: string;
  children?: ComponentChildren;
}

export function OrbitaHead({ title, children }: OrbitaHeadProps) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
  }, [title]);

  useEffect(() => {
    // Handle meta tags and other head elements
    // This is a simplified implementation
    // In a full implementation, you'd want to manage head elements more carefully
    
    return () => {
      // Cleanup function to remove added elements
    };
  }, [children]);

  // This component doesn't render anything in the body
  // It only manages document head elements
  return null;
}