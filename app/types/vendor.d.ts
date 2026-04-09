declare module "encoding-japanese";
declare module "lamejs";
declare module "vinxi/types/client" {}
declare module "@tanstack/react-start/router-manifest" {
  export function getRouterManifest(): unknown;
}
declare module "*.wasm" {
  const content: WebAssembly.Module;
  export default content;
}
declare module "*.css?url" {
  const url: string;
  export default url;
}
