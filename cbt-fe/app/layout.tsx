import "@/app/globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "CBT Platform",
  description: "Computer-Based Testing Frontend",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
