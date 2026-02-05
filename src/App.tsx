import { RouterProvider } from "react-router-dom";
import { ThemeAndLanguageBar } from "@/components/layout";
import { router } from "@/router";

function App() {
  return (
    <>
      <ThemeAndLanguageBar />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
