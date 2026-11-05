import { readFileSync } from "node:fs";
import { join } from "node:path";

export function imageReferenceToBlob(reference: string) {
  if (reference === "/visuals/sample-uploads/student-smart-planter-sketch.png") {
    const bytes = readFileSync(join(process.cwd(), "public", reference.slice(1)));
    return { blob: new Blob([new Uint8Array(bytes)], { type: "image/png" }), filename: "student-sketch.png" };
  }
  const match = reference.match(/^data:(image\/(png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match || reference.length > 4_100_000) return undefined;
  const bytes = Buffer.from(match[3], "base64");
  if (!bytes.length || bytes.length > 3_000_000) return undefined;
  const valid = match[2] === "png" ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : match[2] === "jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  if (!valid) return undefined;
  return { blob: new Blob([new Uint8Array(bytes)], { type: match[1] }), filename: `student-sketch.${match[2] === "jpeg" ? "jpg" : match[2]}` };
}
