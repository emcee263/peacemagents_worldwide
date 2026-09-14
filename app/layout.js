import "./globals.css";
export const metadata={
  title:"PEACEMAGENTS WORLDWIDE",
  description:"Streetwear for the calm rebels. Bold ideas. Quiet energy. No borders."
};
export default function RootLayout({children}) {
  return <html lang="en"><body>{children}</body></html>;
}