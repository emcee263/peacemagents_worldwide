import "./globals.css";
import { CartProvider } from "../components/CartProvider";

export const metadata = {
  title: "PEACEMAGENTS WORLDWIDE",
  description: "Streetwear for the calm rebels.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}