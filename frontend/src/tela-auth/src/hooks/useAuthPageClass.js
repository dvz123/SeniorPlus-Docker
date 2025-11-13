import { useEffect } from "react";

// Adds a CSS class to body while an auth page is mounted, to control top padding/background
export default function useAuthPageClass() {
  useEffect(() => {
    document.body.classList.add("auth-page");
    return () => {
      document.body.classList.remove("auth-page");
    };
  }, []);
}
