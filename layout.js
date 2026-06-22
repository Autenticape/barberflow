export const metadata = {
  title: "BarberFlow — Gestão para barbearias",
  description: "Agenda, financeiro e estoque para sua barbearia em um só lugar.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
