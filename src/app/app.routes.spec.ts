import { routes } from "./app.routes";

describe("routes", () => {
  it("should redirect the empty path to /home", () => {
    const redirect = routes.find((r) => r.path === "");
    expect(redirect?.redirectTo).toBe("/home");
  });

  it("should define home, projects and profile routes", () => {
    const paths = routes.map((r) => r.path);
    expect(paths).toContain("home");
    expect(paths).toContain("projects");
    expect(paths).toContain("profile");
  });

  it("should redirect unknown paths to /home", () => {
    const wildcard = routes.find((r) => r.path === "**");
    expect(wildcard?.redirectTo).toBe("/home");
  });
});
