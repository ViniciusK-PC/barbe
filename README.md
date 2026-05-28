# BarberShop App

Aplicativo mobile-first de barbearia com frontend em Next.js/Tailwind e API em ASP.NET Core com Entity Framework Core para PostgreSQL/Neon.

## Estrutura

- `api/BarberShop.Api`: API C# com agenda, loja, pedidos, produtos, servicos e resumo admin.
- `frontend/barbershop-web`: frontend Next.js com abas mobile para inicio, agenda, loja e admin.

## Configurar Neon

1. Crie um banco PostgreSQL no Neon.
2. Copie a connection string.
3. Configure a variavel de ambiente `DATABASE_URL` com a URL do Neon.
4. Rode a migration:

```powershell
$env:DATABASE_URL="postgresql://usuario:senha@host/neondb?sslmode=require"
dotnet tool restore
dotnet tool run dotnet-ef database update --project api/BarberShop.Api/BarberShop.Api.csproj --startup-project api/BarberShop.Api/BarberShop.Api.csproj
```

## Rodar local

API:

```powershell
dotnet run --project api/BarberShop.Api/BarberShop.Api.csproj --launch-profile https
```

Frontend:

```powershell
cd frontend/barbershop-web
npm install
npm run dev
```

Abra `http://localhost:3000`.
