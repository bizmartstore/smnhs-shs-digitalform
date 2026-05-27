import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import SignaturePad from "signature_pad";
import { Button } from "@/components/ui/button";

export type SignaturePadHandle = {
  isEmpty: () => boolean;
  toData: () => any[];
  fromData: (data: any[]) => void;
  clear: () => void;
};

type Props = { label: string; invalid?: boolean; onChangeStroke?: () => void };

export const SignaturePadField = forwardRef<SignaturePadHandle, Props>(
  function SignaturePadField({ label, invalid, onChangeStroke }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const padRef = useRef<SignaturePad | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const resize = () => {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const data = padRef.current?.toData();
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        const ctx = canvas.getContext("2d");
        ctx?.scale(ratio, ratio);
        padRef.current?.clear();
        if (data) padRef.current?.fromData(data);
      };

      padRef.current = new SignaturePad(canvas, {
        backgroundColor: "rgb(255,255,255)",
        penColor: "rgb(0,0,0)",
        minWidth: 0.6,
        maxWidth: 2.2,
        throttle: 8,
      });
      if (onChangeStroke) {
        padRef.current.addEventListener("endStroke", onChangeStroke);
      }
      resize();
      window.addEventListener("resize", resize);
      return () => {
        window.removeEventListener("resize", resize);
        padRef.current?.off();
      };
    }, [onChangeStroke]);

    useImperativeHandle(ref, () => ({
      isEmpty: () => padRef.current?.isEmpty() ?? true,
      toData: () => padRef.current?.toData() ?? [],
      fromData: (data: any[]) => padRef.current?.fromData(data),
      clear: () => padRef.current?.clear(),
    }));

    return (
      <div className="space-y-2">
        <div className="text-sm font-medium">{label}</div>
        <div className={`relative rounded-md border-2 bg-white overflow-hidden transition-colors ${invalid ? "border-destructive ring-2 ring-destructive/30" : "border-input"}`}>
          <canvas
            ref={canvasRef}
            className="block w-full h-40 touch-none"
            style={{ touchAction: "none" }}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => padRef.current?.clear()}
        >
          Clear Signature
        </Button>
      </div>
    );
  },
);
