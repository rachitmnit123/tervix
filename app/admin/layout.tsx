export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body style={{ margin: 0, fontFamily: 'Inter, sans-serif', background: '#0b1326', color: '#dae2fd' }}>
        {children}
      </body>
    </html>
  );
}
