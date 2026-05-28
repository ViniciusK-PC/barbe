"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Home,
  Package,
  Plus,
  Scissors,
  Shield,
  ShoppingBag,
  Store,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Service = {
  id: number;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
};

type Product = {
  id: number;
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:7026";

const fallbackServices: Service[] = [
  { id: 1, name: "Corte masculino", description: "Tesoura ou maquina com acabamento.", durationMinutes: 40, price: 45 },
  { id: 2, name: "Barba completa", description: "Toalha quente, navalha e finalizacao.", durationMinutes: 30, price: 35 },
  { id: 3, name: "Corte + barba", description: "Combo completo para sair pronto.", durationMinutes: 70, price: 75 },
];

const fallbackProducts: Product[] = [
  { id: 1, name: "Pomada modeladora", description: "Fixacao media com acabamento natural.", price: 39.9, stockQuantity: 18 },
  { id: 2, name: "Oleo para barba", description: "Hidrata e deixa a barba alinhada.", price: 49.9, stockQuantity: 12 },
  { id: 3, name: "Shampoo de barba", description: "Limpeza suave para uso diario.", price: 34.9, stockQuantity: 20 },
];

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("home");
  const [services, setServices] = useState<Service[]>(fallbackServices);
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [selectedServiceId, setSelectedServiceId] = useState("1");
  const [selectedProductId, setSelectedProductId] = useState("1");
  const [message, setMessage] = useState("");

  const getJson = useCallback(async function getJson<T>(path: string, fallback: T): Promise<T> {
    try {
      const response = await fetch(`${apiUrl}${path}`, { cache: "no-store" });
      if (!response.ok) return fallback;
      return response.json();
    } catch {
      return fallback;
    }
  }, []);

  const loadData = useCallback(async () => {
    const [serviceData, productData] = await Promise.all([
      getJson<Service[]>("/api/services", fallbackServices),
      getJson<Product[]>("/api/products", fallbackProducts),
    ]);

    setServices(serviceData);
    setProducts(productData);
  }, [getJson]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  async function createAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const response = await fetch(`${apiUrl}/api/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: form.get("customerName"),
        customerPhone: form.get("customerPhone"),
        customerEmail: form.get("customerEmail"),
        serviceId: Number(selectedServiceId),
        startAt: new Date(String(form.get("startAt"))).toISOString(),
        notes: form.get("notes"),
      }),
    }).catch(() => null);

    setMessage(response?.ok ? "Horario reservado. A barbearia recebeu seu agendamento." : "Nao foi possivel agendar esse horario.");
    if (response?.ok) {
      event.currentTarget.reset();
      await loadData();
    }
  }

  async function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const response = await fetch(`${apiUrl}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: form.get("customerName"),
        customerPhone: form.get("customerPhone"),
        items: [{ productId: Number(selectedProductId), quantity: Number(form.get("quantity")) }],
      }),
    }).catch(() => null);

    setMessage(response?.ok ? "Pedido enviado. O barbeiro vai separar seu produto." : "Nao foi possivel enviar o pedido.");
    if (response?.ok) {
      event.currentTarget.reset();
      await loadData();
    }
  }

  const selectedService = useMemo(
    () => services.find((service) => service.id === Number(selectedServiceId)) ?? services[0],
    [selectedServiceId, services],
  );

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === Number(selectedProductId)) ?? products[0],
    [selectedProductId, products],
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#f8f5ef] text-zinc-950">
      <header className="sticky top-0 z-10 border-b border-zinc-200/80 bg-[#f8f5ef]/95 px-5 pb-4 pt-5 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Barbearia premium</p>
            <h1 className="mt-1 text-2xl font-black tracking-normal">BarberShop</h1>
          </div>
          <Link
            aria-label="Entrar no painel admin"
            className="grid size-11 place-items-center rounded-md border border-zinc-300 bg-white text-zinc-800 shadow-sm"
            href="/admin"
          >
            <Shield size={20} />
          </Link>
        </div>
      </header>

      <section className="flex-1 px-5 pb-28 pt-5">
        {message ? (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
            <CheckCircle2 size={18} />
            {message}
          </div>
        ) : null}

        {activeTab === "home" ? <HomeView services={services} products={products} setActiveTab={setActiveTab} /> : null}

        {activeTab === "schedule" ? (
          <ScheduleView
            createAppointment={createAppointment}
            selectedService={selectedService}
            selectedServiceId={selectedServiceId}
            services={services}
            setSelectedServiceId={setSelectedServiceId}
          />
        ) : null}

        {activeTab === "shop" ? (
          <ShopView
            createOrder={createOrder}
            products={products}
            selectedProduct={selectedProduct}
            selectedProductId={selectedProductId}
            setSelectedProductId={setSelectedProductId}
          />
        ) : null}
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-zinc-200 bg-white px-4 pb-4 pt-2">
        <div className="grid grid-cols-3 gap-2">
          <TabButton active={activeTab === "home"} icon={<Home size={20} />} label="Inicio" onClick={() => setActiveTab("home")} />
          <TabButton active={activeTab === "schedule"} icon={<CalendarDays size={20} />} label="Agenda" onClick={() => setActiveTab("schedule")} />
          <TabButton active={activeTab === "shop"} icon={<Store size={20} />} label="Loja" onClick={() => setActiveTab("shop")} />
        </div>
      </nav>
    </main>
  );
}

function HomeView({
  products,
  services,
  setActiveTab,
}: {
  products: Product[];
  services: Service[];
  setActiveTab: (tab: string) => void;
}) {
  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-md bg-zinc-950 text-white shadow-xl">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-amber-300">Aberto hoje</span>
            <span className="flex items-center gap-1 text-zinc-300">
              <Clock3 size={15} />
              09:00 - 20:00
            </span>
          </div>
        </div>
        <div className="px-5 py-6">
          <h2 className="text-3xl font-black leading-tight tracking-normal">Visual alinhado sem espera.</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-300">Agende corte, barba e compre produtos selecionados direto pelo celular.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button className="h-12 rounded-md bg-amber-500 px-4 font-bold text-zinc-950" onClick={() => setActiveTab("schedule")} type="button">
              Agendar
            </button>
            <button className="h-12 rounded-md border border-white/15 px-4 font-bold text-white" onClick={() => setActiveTab("shop")} type="button">
              Ver loja
            </button>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle title="Servicos em destaque" icon={<Scissors size={20} />} />
        <div className="mt-3 space-y-3">
          {services.map((service) => (
            <div key={service.id} className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{service.name}</h3>
                  <p className="mt-1 text-sm leading-5 text-zinc-600">{service.description}</p>
                </div>
                <span className="whitespace-nowrap rounded-md bg-zinc-100 px-2 py-1 text-sm font-black">{money.format(service.price)}</span>
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-amber-700">{service.durationMinutes} min</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle title="Produtos da casa" icon={<ShoppingBag size={20} />} />
        <div className="mt-3 grid grid-cols-2 gap-3">
          {products.slice(0, 2).map((product) => (
            <div key={product.id} className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="mb-4 grid size-10 place-items-center rounded-md bg-amber-100 text-amber-800">
                <Package size={22} />
              </div>
              <h3 className="font-bold leading-5">{product.name}</h3>
              <p className="mt-2 text-sm font-black">{money.format(product.price)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ScheduleView(props: {
  createAppointment: (event: FormEvent<HTMLFormElement>) => void;
  selectedService?: Service;
  selectedServiceId: string;
  services: Service[];
  setSelectedServiceId: (value: string) => void;
}) {
  return (
    <form className="space-y-4" onSubmit={props.createAppointment}>
      <SectionTitle title="Reservar horario" icon={<CalendarDays size={20} />} />
      <Input name="customerName" placeholder="Nome do cliente" required />
      <Input name="customerPhone" placeholder="WhatsApp" required />
      <Input name="customerEmail" placeholder="E-mail opcional" type="email" />
      <select className="h-12 w-full rounded-md border border-zinc-300 bg-white px-3 font-medium" value={props.selectedServiceId} onChange={(event) => props.setSelectedServiceId(event.target.value)}>
        {props.services.map((service) => (
          <option key={service.id} value={service.id}>
            {service.name}
          </option>
        ))}
      </select>
      <Input name="startAt" type="datetime-local" required />
      <textarea name="notes" className="min-h-24 w-full rounded-md border border-zinc-300 bg-white px-3 py-3 outline-none focus:border-zinc-950" placeholder="Observacoes" />
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-950">
        {props.selectedService?.name}: {props.selectedService?.durationMinutes} min, {money.format(props.selectedService?.price ?? 0)}
      </div>
      <PrimaryButton icon={<Plus size={19} />} label="Confirmar reserva" />
    </form>
  );
}

function ShopView(props: {
  createOrder: (event: FormEvent<HTMLFormElement>) => void;
  products: Product[];
  selectedProduct?: Product;
  selectedProductId: string;
  setSelectedProductId: (value: string) => void;
}) {
  return (
    <div className="space-y-5">
      <SectionTitle title="Loja da barbearia" icon={<Store size={20} />} />
      <div className="space-y-3">
        {props.products.map((product) => (
          <div key={product.id} className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold">{product.name}</h3>
                <p className="mt-1 text-sm leading-5 text-zinc-600">{product.description}</p>
              </div>
              <span className="text-sm font-black">{money.format(product.price)}</span>
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-zinc-500">Estoque: {product.stockQuantity}</p>
          </div>
        ))}
      </div>
      <form className="space-y-4 rounded-md border border-zinc-200 bg-white p-4 shadow-sm" onSubmit={props.createOrder}>
        <h3 className="font-black">Novo pedido</h3>
        <Input name="customerName" placeholder="Nome do cliente" required />
        <Input name="customerPhone" placeholder="WhatsApp" required />
        <select className="h-12 w-full rounded-md border border-zinc-300 bg-white px-3 font-medium" value={props.selectedProductId} onChange={(event) => props.setSelectedProductId(event.target.value)}>
          {props.products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
        <Input min={1} name="quantity" placeholder="Quantidade" required type="number" />
        <div className="text-sm font-medium text-zinc-600">Selecionado: {props.selectedProduct?.name}</div>
        <PrimaryButton icon={<ShoppingBag size={19} />} label="Enviar pedido" />
      </form>
    </div>
  );
}

function TabButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button className={`flex h-14 flex-col items-center justify-center gap-1 rounded-md text-xs font-bold ${active ? "bg-zinc-950 text-white" : "text-zinc-500"}`} onClick={onClick} type="button">
      {icon}
      {label}
    </button>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-black">{title}</h2>
      <span className="text-amber-700">{icon}</span>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="h-12 w-full rounded-md border border-zinc-300 bg-white px-3 outline-none focus:border-zinc-950" />;
}

function PrimaryButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 font-black text-white shadow-lg" type="submit">
      {icon}
      {label}
    </button>
  );
}
