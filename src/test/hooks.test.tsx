import { describe, it, expect } from "vitest";
import { render } from "@testing-library/preact";
import { useOrbita } from "../hooks/useOrbita";
import { OrbitaContext } from "../context";

function TestComponent() {
  const orbita = useOrbita();
  return <div data-testid="test">{orbita ? "has-context" : "no-context"}</div>;
}

describe("useOrbita hook", () => {
  it("should throw error when used outside context", () => {
    expect(() => render(<TestComponent />)).toThrow(
      "useOrbita must be used within an Orbita app",
    );
  });

  it("should return context when used within provider", () => {
    const mockContext = {
      page: { component: "Test", props: {}, url: "/test" },
      visit: () => {},
      reload: () => {},
      post: () => {},
      put: () => {},
      patch: () => {},
      delete: () => {},
    };

    const { getByText } = render(
      <OrbitaContext.Provider value={mockContext}>
        <TestComponent />
      </OrbitaContext.Provider>,
    );

    expect(getByText("has-context")).toBeDefined();
  });
});
