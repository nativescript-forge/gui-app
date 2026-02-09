import {
  FiSmartphone,
  FiRefreshCw,
  FiAlertCircle,
  FiCpu,
} from "react-icons/fi";
import type { AdbDevice, RunConfig } from "../../../app/types";

interface DeviceSelectionProps {
  runConfig: RunConfig;
  setRunConfig: (config: RunConfig | ((prev: RunConfig) => RunConfig)) => void;
  devices: AdbDevice[];
  scanning: boolean;
  onScan: () => void;
}

export function DeviceSelection({
  runConfig,
  setRunConfig,
  devices,
  scanning,
  onScan,
}: DeviceSelectionProps) {
  const filteredDevices = devices.filter(
    (d) => d.platform === runConfig.platform,
  );

  return (
    <div className="space-y-6 py-1">
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-base-content/40 block">
          Select Target Device
        </label>
        <button
          onClick={onScan}
          disabled={scanning}
          className={`btn btn-ghost btn-xs gap-1.5 h-8 min-h-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-all ${scanning ? "text-primary bg-primary/5" : ""}`}
        >
          <FiRefreshCw
            className={`w-3.5 h-3.5 ${scanning ? "animate-spin" : ""}`}
          />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            Refresh
          </span>
        </button>
      </div>

      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2.5 custom-scrollbar">
        {/* Auto Select Option */}
        <button
          className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all group ${
            !runConfig.deviceId && !runConfig.emulator
              ? "bg-primary/10 border-primary shadow-lg ring-2 ring-primary/10"
              : "bg-base-200/50 border-transparent hover:border-base-300 opacity-80 hover:opacity-100"
          }`}
          onClick={() =>
            setRunConfig((prev) => ({
              ...prev,
              deviceId: undefined,
              emulator: false,
            }))
          }
        >
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-xl shadow-inner transition-colors ${!runConfig.deviceId && !runConfig.emulator ? "bg-primary text-white" : "bg-primary/10 text-primary"}`}
            >
              <FiRefreshCw
                className={`w-5 h-5 ${!runConfig.deviceId && !runConfig.emulator ? "" : "group-hover:rotate-180 transition-transform duration-500"}`}
              />
            </div>
            <div className="text-left">
              <div className="text-sm font-black text-base-content tracking-tight">
                Auto Select
              </div>
              <div className="text-[10px] opacity-50 font-bold mt-0.5 leading-snug">
                Let CLI choose the best available device
              </div>
            </div>
          </div>
          {!runConfig.deviceId && !runConfig.emulator && (
            <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-lg ring-2 ring-primary/20" />
          )}
        </button>

        {/* Emulator Option */}
        <button
          className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all group ${
            runConfig.emulator
              ? "bg-primary/10 border-primary shadow-lg ring-2 ring-primary/10"
              : "bg-base-200/50 border-transparent hover:border-base-300 opacity-80 hover:opacity-100"
          }`}
          onClick={() =>
            setRunConfig((prev) => ({
              ...prev,
              deviceId: undefined,
              emulator: true,
            }))
          }
        >
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-xl shadow-inner transition-colors ${runConfig.emulator ? "bg-info text-white" : "bg-info/10 text-info"}`}
            >
              <FiCpu className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-left">
              <div className="text-sm font-black text-base-content tracking-tight">
                Native Emulator
              </div>
              <div className="text-[10px] opacity-50 font-bold mt-0.5 leading-snug">
                Force run on{" "}
                {runConfig.platform === "android"
                  ? "Android Emulator"
                  : "iOS Simulator"}
              </div>
            </div>
          </div>
          {runConfig.emulator && (
            <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-lg ring-2 ring-primary/20" />
          )}
        </button>

        {filteredDevices.length > 0 && (
          <div className="divider my-3 opacity-30 text-[9px] font-black uppercase tracking-[0.2em] text-base-content/30 px-2">
            Connected Devices
          </div>
        )}

        {filteredDevices.map((device) => (
          <button
            key={device.id}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all group ${
              runConfig.deviceId === device.id
                ? "bg-primary/10 border-primary shadow-lg ring-2 ring-primary/10"
                : "bg-base-200/50 border-transparent hover:border-base-300 opacity-80 hover:opacity-100"
            }`}
            onClick={() =>
              setRunConfig((prev) => ({
                ...prev,
                deviceId: device.id,
                emulator: false,
              }))
            }
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-xl shadow-inner transition-colors ${
                  runConfig.deviceId === device.id
                    ? device.status === "device"
                      ? "bg-success text-white"
                      : "bg-warning text-white"
                    : device.status === "device"
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                }`}
              >
                <FiSmartphone className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-left">
                <div className="text-sm font-black text-base-content tracking-tight">
                  {device.model}
                </div>
                <div className="text-[10px] opacity-50 font-bold mt-0.5 leading-snug font-mono">
                  {device.status.toUpperCase()} • {device.id}
                </div>
              </div>
            </div>
            {runConfig.deviceId === device.id && (
              <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-lg ring-2 ring-primary/20" />
            )}
          </button>
        ))}

        {filteredDevices.length === 0 && !scanning && (
          <div className="p-8 text-center bg-base-200/30 rounded-2xl border border-dashed border-base-300">
            <FiAlertCircle className="w-8 h-8 mx-auto mb-3 text-base-content/10" />
            <p className="text-sm font-black text-base-content/40 tracking-tight">
              No {runConfig.platform} devices detected.
            </p>
            <p className="text-[10px] font-bold text-base-content/30 mt-1.5 leading-relaxed max-w-[200px] mx-auto">
              Check connection and ensure USB debugging is active.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
