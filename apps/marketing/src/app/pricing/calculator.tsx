"use client";

import { Slider } from "@pixeleye/ui";
import { useState } from "react";

export function Calculator() {
  const [snapshots, setSnapshots] = useState([10]);
  return (
    <div className="my-12">
      <div>
        <div>
          <p className="mb-4 text-xl">
            {snapshots[0]}K snapshots - $
            {Math.max(snapshots[0] - 5, 0) * 1000 * 0.003} per month
          </p>
        </div>
        <Slider
          value={snapshots}
          onValueChange={setSnapshots}
          min={5}
          max={100}
          step={1}
        />
      </div>
    </div>
  );
}
