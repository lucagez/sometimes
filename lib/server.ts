export const server = async <T>(exec: () => T | Promise<T>, _default: T) => {
  if (typeof window !== "undefined" && "Deno" in window) {
    return await exec();
  }
  return _default
};

export const serverFunc = <T>(exec: (req: Request) => Promise<T>): (req: Request) => Promise<T> => {
  return (req: Request) => exec(req)
}