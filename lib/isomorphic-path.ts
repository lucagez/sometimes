export const isomorphicPath = (base: string): string => {
  // @ts-ignore: for now
  return btoa(
    // new URL(base).pathname.replace(new RegExp(`.*\/${BASE_PATH}\/`), ""),
    // TODO: REFACTOR GLOBAL BASE_PATH
    new URL(base).pathname.replace(new RegExp(`.*\/${'src'}\/`), ""),
  );
};
