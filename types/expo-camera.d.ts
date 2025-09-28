declare module 'expo-camera' {
  // Provide minimal runtime values to satisfy code that reads enums at runtime.
  // These are `any` to avoid colliding with the real library's types during type-check.
  export const Camera: any;
  export const CameraType: any;
  export const FlashMode: any;
}
