import { createFoundationServices, FoundationServices } from "../platform/foundationServices";
import { ApiKernel, createApiKernel } from "../http/apiKernel";
import { registerPS01Routes } from "./ps01.routes";
import { registerPS02Routes } from "./ps02.routes";
import { registerPS03Routes } from "./ps03.routes";
import { registerPS04Routes } from "./ps04.routes";
import { registerPS05Routes } from "./ps05.routes";
import { registerPS06Routes } from "./ps06.routes";
import { registerPS07Routes } from "./ps07.routes";
import { registerPS08Routes } from "./ps08.routes";
import { registerPS09Routes } from "./ps09.routes";
import { registerPS10Routes } from "./ps10.routes";
import { registerPS11Routes } from "./ps11.routes";
import { registerPS12Routes } from "./ps12.routes";
import { registerPS13Routes } from "./ps13.routes";
import { registerPS14Routes } from "./ps14.routes";
import { registerCfgRoutes } from "./cfg.routes";
import { registerP01WorkflowRoutes } from "./p01-workflow.routes";

export function registerFoundationRoutes(kernel: ApiKernel): void {
  registerP01WorkflowRoutes(kernel);
  registerPS01Routes(kernel);
  registerPS02Routes(kernel);
  registerPS03Routes(kernel);
  registerPS04Routes(kernel);
  registerPS05Routes(kernel);
  registerPS06Routes(kernel);
  registerPS07Routes(kernel);
  registerPS08Routes(kernel);
  registerPS09Routes(kernel);
  registerPS10Routes(kernel);
  registerPS11Routes(kernel);
  registerPS12Routes(kernel);
  registerPS13Routes(kernel);
  registerPS14Routes(kernel);
  registerCfgRoutes(kernel);
}

export function createFoundationApi(services: FoundationServices = createFoundationServices()): ApiKernel {
  const kernel = createApiKernel(services);
  registerFoundationRoutes(kernel);
  return kernel;
}

export * from "./ps01.routes";
export * from "./ps02.routes";
export * from "./ps03.routes";
export * from "./ps04.routes";
export * from "./ps05.routes";
export * from "./ps06.routes";
export * from "./ps07.routes";
export * from "./ps08.routes";
export * from "./ps09.routes";
export * from "./ps10.routes";
export * from "./ps11.routes";
export * from "./ps12.routes";
export * from "./ps13.routes";
export * from "./ps14.routes";
export * from "./p01-workflow.routes";
