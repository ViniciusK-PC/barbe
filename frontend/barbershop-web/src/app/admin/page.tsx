"use client";

import { CalendarDays, ChevronLeft, Clock3, LayoutDashboard, PackageSearch, ReceiptText, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Appointment = {
  id: number;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  startAt: string;
  endAt: string;
  status: string;
};

type AdminSummary = {
  appointmentsToday: number;
  pendingOrders: number;
  productsLowStock: number;
  monthlyRevenue: number;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:7026";
const fallbackSummary: AdminSummary = {
  appointmentsToday: 0,
  pendingOrders: 0,
  productsLowStock: 0,
  monthlyRevenue: 0,
};

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

export default function AdminPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [summary, setSummary] = useState<AdminSummary>(fallbackSummary);

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
    const [appointmentData, summaryData] = await Promise.all([
      getJson<Appointment[]>("/api/appointments", []),
      getJson<AdminSummary>("/api/admin/summary", fallbackSummary),
    ]);

    setAppointments(appointmentData);
    setSummary(summaryData);
  }, [getJson]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  return (
    <main className="min-h-dvh bg-zinc-100 text-zinc-950">
      <div className="mx-auto w-full max-w-5xl">
        <header className="border-b border-zinc-200 bg-white px-5 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Area administrativa</p>
              <h1 className="mt-1 text-2xl font-black tracking-normal">Painel BarberShop</h1>
            </div>
            <Link className="flex h-11 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-bold" href="/">
              <ChevronLeft size={18} />
              App
            </Link>
          </div>
        </header>

        <section className="space-y-6 px-5 py-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric icon={<CalendarDays size={20} />} label="Agenda hoje" value={summary.appointmentsToday} />
            <Metric icon={<ReceiptText size={20} />} label="Pedidos" value={summary.pendingOrders} />
            <Metric icon={<PackageSearch size={20} />} label="Baixo estoque" value={summary.productsLowStock} />
            <Metric icon={<TrendingUp size={20} />} label="Receita mes" value={money.format(summary.monthlyRevenue)} />
          </div>

          <section className="rounded-md border border-zinc-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4">
              <div>
                <h2 className="text-lg font-black">Agenda operacional</h2>
                <p className="mt-1 text-sm text-zinc-600">Proximos horarios e clientes agendados.</p>
              </div>
              <LayoutDashboard className="text-amber-700" size={22} />
            </div>
            <div className="divide-y divide-zinc-100">
              {appointments.length === 0 ? (
                <div className="px-4 py-8 text-sm font-medium text-zinc-600">Nenhum horario carregado ainda.</div>
              ) : (
                appointments.map((appointment) => (
                  <div key={appointment.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black">{appointment.customerName}</h3>
                        <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-bold text-zinc-700">{appointment.status}</span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-600">{appointment.serviceName} · {appointment.customerPhone}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-black text-zinc-900">
                      <Clock3 size={17} className="text-amber-700" />
                      {time.format(new Date(appointment.startAt))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className="grid size-9 place-items-center rounded-md bg-amber-100 text-amber-800">{icon}</span>
      </div>
      <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}
