// Orbita - Seamless Preact integration for Foguete
// Inspired by Inertia.js but tailored for Lua backends

export { createOrbitaApp } from "./app";
export { OrbitaLink, OrbitaLink as Link } from "./components/Link";
export { OrbitaHead } from "./components/Head";
export { useOrbita } from "./hooks/useOrbita";
export { useForm } from "./hooks/useForm";
export { router } from "./router";
export { zodAdapter } from "./adapters/zod";
export type {
  OrbitaPage,
  OrbitaProps,
  OrbitaResponse,
  OrbitaConfig,
  OrbitaVisitOptions,
} from "./types";
export type {
  FormState,
  UseFormOptions,
  FormHelpers,
  FormReturn,
  SchemaAdapter,
} from "./hooks/useForm";
