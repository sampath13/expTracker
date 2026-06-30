import { Platform, PermissionsAndroid } from 'react-native';
import { PERMISSIONS } from 'react-native-permissions';
import { usePermission } from './usePermission';

const CAMERA_PERMISSION = Platform.select({
  ios: PERMISSIONS.IOS.CAMERA,
  android: PERMISSIONS.ANDROID.CAMERA,
  default: PERMISSIONS.ANDROID.CAMERA,
});

export function useCameraPermission() {
  return usePermission(CAMERA_PERMISSION);
}
