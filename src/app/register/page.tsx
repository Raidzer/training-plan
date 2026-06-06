import { Suspense } from "react";
import { RegisterClient } from "./RegisterClient/RegisterClient";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterClient />
    </Suspense>
  );
}
