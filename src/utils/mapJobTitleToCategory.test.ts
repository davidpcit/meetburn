import { describe, it, expect } from "vitest";
import { mapJobTitleToCategory } from "./mapJobTitleToCategory";

describe("mapJobTitleToCategory", () => {
  it("maps junior titles to Analista Junior", () => {
    expect(mapJobTitleToCategory("Software Developer Junior")).toBe("Analista Junior");
    expect(mapJobTitleToCategory("Trainee Engineer")).toBe("Analista Junior");
    expect(mapJobTitleToCategory("Intern")).toBe("Analista Junior");
    expect(mapJobTitleToCategory("Becario de Desarrollo")).toBe("Analista Junior");
  });

  it("maps senior/lead titles to Analista Senior", () => {
    expect(mapJobTitleToCategory("Senior Software Engineer")).toBe("Analista Senior");
    expect(mapJobTitleToCategory("Tech Lead")).toBe("Analista Senior");
    expect(mapJobTitleToCategory("Especialista en Datos")).toBe("Analista Senior");
    expect(mapJobTitleToCategory("Lead Developer")).toBe("Analista Senior");
  });

  it("maps manager titles to Project Manager", () => {
    expect(mapJobTitleToCategory("Project Manager")).toBe("Project Manager");
    expect(mapJobTitleToCategory("Jefe de Proyecto")).toBe("Project Manager");
    expect(mapJobTitleToCategory("Responsable de Equipo")).toBe("Project Manager");
    expect(mapJobTitleToCategory("Coordinator")).toBe("Project Manager");
  });

  it("maps director/VP titles to Director", () => {
    expect(mapJobTitleToCategory("Director de Tecnología")).toBe("Director");
    expect(mapJobTitleToCategory("Head of Engineering")).toBe("Director");
    expect(mapJobTitleToCategory("VP of Product")).toBe("Director");
    expect(mapJobTitleToCategory("Vice President")).toBe("Director");
  });

  it("maps C-suite titles to C-Level", () => {
    expect(mapJobTitleToCategory("CEO")).toBe("C-Level");
    expect(mapJobTitleToCategory("Chief Technology Officer")).toBe("C-Level");
    expect(mapJobTitleToCategory("CTO")).toBe("C-Level");
    expect(mapJobTitleToCategory("CFO")).toBe("C-Level");
    expect(mapJobTitleToCategory("CISO")).toBe("C-Level");
  });

  it("returns null when no keyword matches", () => {
    expect(mapJobTitleToCategory("Comercial")).toBeNull();
    expect(mapJobTitleToCategory("")).toBeNull();
    expect(mapJobTitleToCategory("Administrativo")).toBeNull();
  });

  it("is case-insensitive", () => {
    expect(mapJobTitleToCategory("SENIOR DEVELOPER")).toBe("Analista Senior");
    expect(mapJobTitleToCategory("junior analyst")).toBe("Analista Junior");
  });
});
