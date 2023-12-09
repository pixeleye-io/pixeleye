import { devices as playwrightDevices } from "playwright";

type PlaywrightDeviceDescriptor = (typeof playwrightDevices)["Desktop Chrome"];

export type DeviceName = keyof typeof playwrightDevices;

export interface DeviceDescriptor extends PlaywrightDeviceDescriptor {
  name: DeviceName;
  icon?: string;
}

const icons = {
  chromium: "chrome",
  firefox: "firefox",
  webkit: "safari",
};

export const getDeviceIcon = (device: DeviceDescriptor) => {
  if (["Desktop Edge", "Desktop Edge HiDPI"].includes(device.name as string)) {
    return "edge";
  }

  const icon = icons[device.defaultBrowserType];

  return icon;
};

// TODO - I should move this to a separate json file rather than dynamically generating it
export const devices: Record<DeviceName, DeviceDescriptor> = Object.keys(
  playwrightDevices
).reduce(
  (acc, name: DeviceName) => {
    acc[name] = {
      ...playwrightDevices[name],
      name,
    };

    const icon = getDeviceIcon(acc[name]);

    acc[name].icon = icon;

    return acc;
  },
  {} as Record<DeviceName, DeviceDescriptor>
);
