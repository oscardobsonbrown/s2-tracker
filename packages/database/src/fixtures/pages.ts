export const testPages = {
  home: {
    id: 1,
    name: "Home Page",
  },
  about: {
    id: 2,
    name: "About Page",
  },
  contact: {
    id: 3,
    name: "Contact Page",
  },
} as const;

export const createTestPage = (name: string) => ({
  name,
});
