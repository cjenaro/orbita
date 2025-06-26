import { ComponentChildren } from "preact";
import { useOrbita } from "../hooks/useOrbita";
import { OrbitaVisitOptions } from "../types";

interface OrbitaLinkProps {
  href: string;
  method?: "get" | "post" | "put" | "patch" | "delete";
  data?: Record<string, any>;
  replace?: boolean;
  preserveState?: boolean;
  preserveScroll?: boolean;
  preserveUrl?: boolean;
  only?: string[];
  headers?: Record<string, string>;
  className?: string;
  children: ComponentChildren;
  onClick?: (event: MouseEvent) => void;
}

export function OrbitaLink({
  href,
  method = "get",
  data = {},
  replace = false,
  preserveState = false,
  preserveScroll = false,
  preserveUrl = false,
  only = [],
  headers = {},
  className,
  children,
  onClick,
  ...props
}: OrbitaLinkProps) {
  const { visit } = useOrbita();

  function handleClick(event: MouseEvent) {
    // Call custom onClick handler
    onClick?.(event);

    // Don't handle if default was prevented
    if (event.defaultPrevented) {
      return;
    }

    // Don't handle if modifier keys are pressed
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    // Don't handle if right click
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();

    const options: OrbitaVisitOptions = {
      method,
      data,
      replace,
      preserveState,
      preserveScroll,
      only,
      preserveUrl,
      headers,
    };

    visit(href, options);
  }

  return (
    <a href={href} className={className} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}

