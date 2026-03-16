import AppRouter from "@/components/AppRouter";
import AuthInitializer from "@/components/AuthInitializer";
import { ConfirmDialogProvider } from "@/components/ConfirmDialogProvider";
export function App() {
  return (
    <AuthInitializer>
      <ConfirmDialogProvider>
        <AppRouter />
      </ConfirmDialogProvider>
    </AuthInitializer>
  );
}

export default App;
