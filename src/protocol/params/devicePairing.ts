/**
 * Device Pairing API Parameter Types
 *
 * Parameter and result types for device pairing operations.
 *
 * @module protocol/params/devicePairing
 */

export interface DevicePairListParams {}

export interface DevicePairApproveParams {
  nodeId: string;
  requestId: string;
}

export interface DevicePairRejectParams {
  pairingId: string;
}

export interface DeviceTokenRotateParams {
  nodeId: string;
}

export interface DeviceTokenRevokeParams {
  nodeId: string;
  token: string;
}
