
export const match = (pattern: string) => {
  return {
    test: (req: Request) => {
      const result = new URLPattern({ pathname: pattern }).exec(req.url)
      return result && result.pathname.groups
    }
  }
}
