import type { ChangeEvent } from "react";

export type SpeedToPaceValues = {
  speedKmh: number;
  speedMps: number;
  speedMph: number;
  paceKmMinutes: number;
  paceKmSeconds: number;
  paceMileMinutes: number;
  paceMileSeconds: number;
};

export type SpeedToPaceInput = "paceKm" | "paceMile" | "speedKmh" | "speedMps" | "speedMph";

export type UseSpeedToPaceReturn = SpeedToPaceValues & {
  handleSpeedKmhChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleSpeedMpsChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleSpeedMphChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handlePaceKmTimeChange: (value: string) => void;
  handlePaceMileTimeChange: (value: string) => void;
  paceKmTimeString: string;
  paceMileTimeString: string;
  speedKmhString: string;
  speedMpsString: string;
  speedMphString: string;
};
