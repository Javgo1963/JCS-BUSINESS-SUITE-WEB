/**
 * ==============================================================
 * JCS BUSINESS SUITE WEB
 * Registration Module Public API
 * ==============================================================
 */

/*
|--------------------------------------------------------------------------
| Contracts
|--------------------------------------------------------------------------
*/

export type { BusinessRegistrationRequest } from "./contracts/BusinessRegistrationRequest";
export type { BusinessRegistrationResult } from "./contracts/BusinessRegistrationResult";

/*
|--------------------------------------------------------------------------
| Registration Types
|--------------------------------------------------------------------------
*/

export * from "./BusinessRegistrationStage";
export * from "./BusinessRegistrationState";
export * from "./BusinessRegistrationProgress";
export * from "./BusinessRegistrationError";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

export * from "./constants/BusinessRegistrationConstants";

/*
|--------------------------------------------------------------------------
| Registration Manager
|--------------------------------------------------------------------------
*/

export { JCSBusinessRegistrationManager } from "./JCSBusinessRegistrationManager";

/*
|--------------------------------------------------------------------------
| Executors
|--------------------------------------------------------------------------
*/

export type {
    BusinessRegistrationExecutor,
    BusinessRegistrationExecutionContext,
} from "./executors/BusinessRegistrationExecutor";

export { default as JCSFirebaseBusinessRegistrationExecutor }
from "./executors/JCSFirebaseBusinessRegistrationExecutor";