export const isomorphicPath = (base: string): string => {
  return new URL(base).pathname.replace(
    new RegExp(`.*\/${window.BASE_PATH}\/`),
    "",
  );
};
