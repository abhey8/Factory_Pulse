import { useEffect, useMemo, useState } from "react";
import { KPICard } from "./components/KPICard";
import { StatusBadge } from "./components/StatusBadge";
import { WorkerDetailModal } from "./components/WorkerDetailModal";
import { WorkstationDetailModal } from "./components/WorkstationDetailModal";
import { EventFeed } from "./components/EventFeed";
import { LoadingState } from "./components/LoadingState";
import { ErrorState } from "./components/ErrorState";
import { EmptyState } from "./components/EmptyState";
import { Card } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "./components/ui/table";
import {
  Activity,
  TrendingUp,
  Users,
  Package,
  Search,
  RefreshCw,
  Download,
  Database,
  Factory,
  Clock
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import {
  DashboardData,
  DashboardFilters,
  fetchDashboardData,
  seedData
} from "./services/api";
import { Worker, Workstation } from "./types";

function searchTerms(value: string) {
  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function matchesSearch(values: Array<string | number | undefined>, terms: string[]) {
  const haystack = values.filter(Boolean).join(" ").toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

export default function App() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [selectedWorkstation, setSelectedWorkstation] = useState<Workstation | null>(null);
  const [workerModalOpen, setWorkerModalOpen] = useState(false);
  const [workstationModalOpen, setWorkstationModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [workstationId, setWorkstationId] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filters: DashboardFilters = {
    workerId: workerId || undefined,
    workstationId: workstationId || undefined
  };

  async function loadDashboard(options: { quiet?: boolean } = {}) {
    if (options.quiet) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await fetchDashboardData(filters);
      setDashboard(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, [workerId, workstationId]);

  const filteredWorkers = useMemo(() => {
    if (!dashboard) return [];
    const terms = searchTerms(activeSearch);
    if (terms.length === 0) return dashboard.workers;

    return dashboard.workers.filter((worker) =>
      matchesSearch([worker.id, worker.name, worker.station], terms)
    );
  }, [dashboard, activeSearch]);

  const filteredWorkstations = useMemo(() => {
    if (!dashboard) return [];
    const terms = searchTerms(activeSearch);
    if (terms.length === 0) return dashboard.workstations;

    return dashboard.workstations.filter((station) =>
      matchesSearch([station.id, station.name, station.type, station.assignedWorker], terms)
    );
  }, [dashboard, activeSearch]);

  const filteredEvents = useMemo(() => {
    if (!dashboard) return [];
    const terms = searchTerms(activeSearch);
    if (terms.length === 0) return dashboard.events;

    return dashboard.events.filter((event) =>
      matchesSearch(
        [event.workerId, event.workerName, event.stationId, event.stationName, event.eventType],
        terms
      )
    );
  }, [dashboard, activeSearch]);

  const handleSearch = () => {
    setActiveSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setActiveSearch("");
  };

  const handleWorkerClick = (worker: Worker) => {
    setSelectedWorker(worker);
    setWorkerModalOpen(true);
  };

  const handleWorkstationClick = (workstation: Workstation) => {
    setSelectedWorkstation(workstation);
    setWorkstationModalOpen(true);
  };

  const handleSeed = async () => {
    setRefreshing(true);
    setError(null);

    try {
      await seedData();
      await loadDashboard({ quiet: true });
    } catch (seedError) {
      setError(seedError instanceof Error ? seedError.message : "Unable to seed data.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = () => {
    if (!dashboard) return;

    const blob = new Blob([JSON.stringify(dashboard, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "factory-dashboard-export.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error && !dashboard) {
    return <ErrorState message={error} onRetry={() => loadDashboard()} />;
  }

  if (!dashboard || (dashboard.allWorkers.length === 0 && dashboard.allWorkstations.length === 0)) {
    return <EmptyState onRefresh={() => loadDashboard()} />;
  }

  const metrics = dashboard.summary;
  const lastUpdated = new Date(dashboard.generatedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Factory className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-slate-900">FactoryPulse AI</h1>
                <p className="text-xs text-slate-500">Manufacturing Analytics Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-xs">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                Backend Connected
              </Badge>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Clock className="w-4 h-4" />
                Last updated: {lastUpdated}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search workers, stations, events..."
                className="pl-10"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSearch();
                  }
                }}
              />
            </div>

            <Button variant="outline" size="sm" onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>

            {activeSearch && (
              <Button variant="ghost" size="sm" onClick={handleClearSearch}>
                Clear
              </Button>
            )}

            <select
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
              value={workerId}
              onChange={(event) => setWorkerId(event.target.value)}
            >
              <option value="">All workers</option>
              {dashboard.allWorkers.map((worker) => (
                <option key={worker.workerId} value={worker.workerId}>
                  {worker.workerId} - {worker.name}
                </option>
              ))}
            </select>

            <select
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
              value={workstationId}
              onChange={(event) => setWorkstationId(event.target.value)}
            >
              <option value="">All stations</option>
              {dashboard.allWorkstations.map((station) => (
                <option key={station.stationId} value={station.stationId}>
                  {station.stationId} - {station.name}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadDashboard({ quiet: true })}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleSeed} disabled={refreshing}>
              <Database className="w-4 h-4 mr-2" />
              Seed Data
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {error && (
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {error}
            </div>
          )}

          {activeSearch && (
            <div className="mt-3 text-xs text-slate-600">
              Showing matches for <span className="font-medium text-slate-900">{activeSearch}</span>:
              {" "}
              {filteredWorkers.length} workers, {filteredWorkstations.length} stations,{" "}
              {filteredEvents.length} events
            </div>
          )}
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-8 py-8">
        <section className="mb-8">
          <h2 className="font-semibold text-slate-900 mb-4">Factory Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPICard
              title="Total Productive Time"
              value={metrics.totalProductiveTime}
              unit="hrs"
              trend="neutral"
              trendValue="Live"
              icon={Clock}
            />
            <KPICard
              title="Total Production"
              value={metrics.totalProduction}
              unit="units"
              trend="neutral"
              trendValue="Live"
              icon={Package}
            />
            <KPICard
              title="Average Utilization"
              value={metrics.avgUtilization}
              unit="%"
              trend="neutral"
              trendValue="Live"
              icon={Activity}
            />
            <KPICard
              title="Avg Production Rate"
              value={metrics.avgProductionRate}
              unit="u/h"
              trend="neutral"
              trendValue="Live"
              icon={TrendingUp}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6 bg-white border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-4">Production Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboard.productionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#64748b" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px"
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="production"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ fill: "#2563eb" }}
                    name="Units Produced"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6 bg-white border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-4">Worker Utilization</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={filteredWorkers.filter((worker) => worker.status !== "absent")}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="id" stroke="#64748b" style={{ fontSize: "11px" }} />
                  <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar dataKey="utilization" fill="#06b6d4" name="Utilization %" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900">Worker Metrics</h2>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600">{filteredWorkers.length} Workers</span>
                </div>
              </div>

              <Card className="bg-white border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Worker</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Active</TableHead>
                      <TableHead className="text-right">Idle</TableHead>
                      <TableHead className="text-right">Utilization</TableHead>
                      <TableHead className="text-right">Units</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWorkers.map((worker) => (
                      <TableRow
                        key={worker.id}
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => handleWorkerClick(worker)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">{worker.name}</p>
                            <p className="text-xs text-slate-500">{worker.id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={worker.status} />
                        </TableCell>
                        <TableCell className="text-right font-medium">{worker.activeTime}h</TableCell>
                        <TableCell className="text-right">{worker.idleTime}h</TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`font-medium ${
                              worker.utilization >= 85
                                ? "text-green-600"
                                : worker.utilization >= 70
                                  ? "text-blue-600"
                                  : "text-amber-600"
                            }`}
                          >
                            {worker.utilization}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">{worker.unitsProduced}</TableCell>
                        <TableCell className="text-right">{worker.unitsPerHour}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900">Workstation Metrics</h2>
                <div className="flex items-center gap-2">
                  <Factory className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600">{filteredWorkstations.length} Stations</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredWorkstations.map((station) => (
                  <Card
                    key={station.id}
                    className="p-5 bg-white border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
                    onClick={() => handleWorkstationClick(station)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{station.name}</h3>
                        <p className="text-xs text-slate-500">
                          {station.id} • {station.type}
                        </p>
                      </div>
                      <StatusBadge status={station.status} />
                    </div>

                    {station.assignedWorker && (
                      <p className="text-xs text-slate-600 mb-3">
                        Operator: <span className="font-medium">{station.assignedWorker}</span>
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-500">Utilization</p>
                        <p className="font-semibold text-slate-900">{station.utilization}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Occupancy</p>
                        <p className="font-semibold text-slate-900">{station.occupancyTime}h</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Units</p>
                        <p className="font-semibold text-slate-900">{station.unitsProduced}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Throughput</p>
                        <p className="font-semibold text-slate-900">{station.throughputRate} u/h</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-1">
            <EventFeed events={filteredEvents} />
          </div>
        </div>
      </main>

      <WorkerDetailModal
        worker={selectedWorker}
        open={workerModalOpen}
        onOpenChange={setWorkerModalOpen}
      />
      <WorkstationDetailModal
        workstation={selectedWorkstation}
        open={workstationModalOpen}
        onOpenChange={setWorkstationModalOpen}
      />
    </div>
  );
}
