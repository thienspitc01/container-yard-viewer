import React, { useState, useMemo, useEffect } from 'react';
import { Container, ParseStats, BlockConfig, VesselStatsData, BlockStats } from './types';
import { parseExcelFile } from './services/excelService';
import FileUpload from './components/FileUpload';
import YardRowView from './components/YardRowView';
import BlockConfigurator from './components/BlockConfigurator';
import VesselStatistics from './components/VesselStatistics';
import YardStatistics from './components/YardStatistics';
import { supabase } from "./supabaseClient";   // ✅ THÊM DÒNG NÀY

// ---------------- DEFAULT BLOCKS ----------------
const DEFAULT_BLOCKS: BlockConfig[] = [
  { name: 'A1', capacity: 676, group: 'GP', isDefault: true, totalBays: 35, rowsPerBay: 6, tiersPerBay: 6 },
  { name: 'B1', capacity: 676, group: 'GP', isDefault: true, totalBays: 35, rowsPerBay: 6, tiersPerBay: 6 },
  { name: 'C1', capacity: 676, group: 'GP', isDefault: true, totalBays: 35, rowsPerBay: 6, tiersPerBay: 6 },
  { name: 'D1', capacity: 676, group: 'GP', isDefault: true, totalBays: 35, rowsPerBay: 6, tiersPerBay: 6 },
  { name: 'A2', capacity: 884, group: 'GP', isDefault: true, totalBays: 35, rowsPerBay: 6, tiersPerBay: 6 },
  { name: 'B2', capacity: 884, group: 'GP', isDefault: true, totalBays: 35, rowsPerBay: 6, tiersPerBay: 6 },
  { name: 'C2', capacity: 884, group: 'GP', isDefault: true, totalBays: 35, rowsPerBay: 6, tiersPerBay: 6 },
  { name: 'D2', capacity: 884, group: 'GP', isDefault: true, totalBays: 35, rowsPerBay: 6, tiersPerBay: 6 },
  { name: 'E1', capacity: 600, group: 'GP', isDefault: true, totalBays: 35, rowsPerBay: 6, tiersPerBay: 6 },
  { name: 'F1', capacity: 676, group: 'GP', isDefault: true, totalBays: 35, rowsPerBay: 6, tiersPerBay: 6 },

  // REEFER
  { name: 'R1', capacity: 650, group: 'REEFER', isDefault: true, totalBays: 35, rowsPerBay: 6, tiersPerBay: 6 },
  { name: 'R3', capacity: 450, group: 'REEFER', isDefault: true, totalBays: 35, rowsPerBay: 6, tiersPerBay: 6 },
  { name: 'R4', capacity: 259, group: 'REEFER', isDefault: true, totalBays: 35, rowsPerBay: 6, tiersPerBay: 6 },
  { name: 'R2', capacity: 400, group: 'REEFER', isDefault: true, totalBays: 35, rowsPerBay: 6, tiersPerBay: 6 },

  // EMPTY
  { name: 'B0', capacity: 1144, group: 'RỖNG', isDefault: true, totalBays: 35, rowsPerBay: 6, tiersPerBay: 6 },
  { name: 'C0', capacity: 940, group: 'RỖNG', isDefault: true, totalBays: 35, rowsPerBay: 6, tiersPerBay: 6 },
  { name: 'D0', capacity: 940, group: 'RỖNG', isDefault: true, totalBays: 35, rowsPerBay: 6, tiersPerBay: 6 },
  { name: 'E0', capacity: 840, group: 'RỖNG', isDefault: true, totalBays: 35, rowsPerBay: 6, tiersPerBay: 6 },
];

const FILTER_COLORS = ['bg-sky-500', 'bg-lime-500', 'bg-amber-500'];

const App: React.FC = () => {

  // ---------------- STATE ----------------
  const [containers, setContainers] = useState<Container[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ParseStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'map' | 'stats'>('map');
  const [isoTypeFilter, setIsoTypeFilter] = useState<'ALL' | 'DRY' | 'REEFER'>('ALL');

  const [vessels, setVessels] = useState<string[]>([]);
  const [selectedVessels, setSelectedVessels] = useState<string[]>(['', '', '']);

  // Load block configs from localStorage
  const [blockConfigs, setBlockConfigs] = useState<BlockConfig[]>(() => {
    try {
      const saved = localStorage.getItem("yardBlockConfigs");
      return saved ? JSON.parse(saved) : DEFAULT_BLOCKS;
    } catch {
      return DEFAULT_BLOCKS;
    }
  });

  // ---------------- LOAD CONTAINERS (FROM DB) ----------------
  const loadContainers = async () => {
    const { data, error } = await supabase.from("containers").select("*");
    if (!error && data) setContainers(data);
  };

  // ---------------- REALTIME SUBSCRIBE ----------------
  useEffect(() => {
    const channel = supabase
      .channel("containers")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "containers" },
        payload => {
          console.log("Realtime update:", payload);
          loadContainers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ---------------- SAVE CONFIG TO LOCALSTORAGE ----------------
  useEffect(() => {
    localStorage.setItem("yardBlockConfigs", JSON.stringify(blockConfigs));
  }, [blockConfigs]);

  // ---------------- HANDLE ADD / REMOVE BLOCK ----------------
  const handleAddBlock = (newBlock: Omit<BlockConfig, 'isDefault'>) => {
    if (blockConfigs.some(b => b.name.toUpperCase() === newBlock.name.toUpperCase())) {
      alert(`Block "${newBlock.name}" already exists.`);
      return;
    }
    setBlockConfigs(prev => [...prev, { ...newBlock, isDefault: false }]);
  };

  const handleRemoveBlock = (blockName: string) => {
    setBlockConfigs(prev => prev.filter(b => b.name !== blockName));
  };

  // ---------------- FILE UPLOAD ----------------
  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setStats(null);
    setVessels([]);
    setSelectedVessels(['', '', '']);

    try {
      const result = await parseExcelFile(file);
      setContainers(result.containers);
      setStats(result.stats);
      setVessels(result.vessels);
    } catch (err: any) {
      setError(err.message || "Unexpected error.");
      setContainers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVesselChange = (index: number, vessel: string) => {
    const newVessels = [...selectedVessels];
    newVessels[index] = vessel;
    setSelectedVessels(newVessels);
  };

  // ---------------- GROUP CONTAINERS BY BLOCK ----------------
  const containersByBlock = useMemo(() => {
    return containers.reduce((acc, cont) => {
      if (!acc[cont.block]) acc[cont.block] = [];
      acc[cont.block].push(cont);
      return acc;
    }, {} as Record<string, Container[]>);
  }, [containers]);

  // ---------------- SEARCH / HIGHLIGHT ----------------
  const highlightedContainerIds = useMemo(() => {
    const t = searchTerm.trim().toUpperCase();
    if (!t) return new Set<string>();

    const normalizedSearch = t.replace(/-/g, "");

    return new Set(
      containers
        .filter(c =>
          c.id.toUpperCase().includes(t) ||
          c.location.replace(/\s/g, '').replace(/-/g, '') === normalizedSearch
        )
        .map(c => c.id)
    );
  }, [searchTerm, containers]);

  // ---------------- VESSEL STATS ----------------
  const vesselStatsData = useMemo(() => {
    const stats: VesselStatsData = {};

    for (const block of blockConfigs) {
      stats[block.name] = {};
    }

    for (const c of containers) {
      if (c.isMultiBay && c.partType === "end") continue;

      if (c.vessel) {
        if (!stats[c.block]) stats[c.block] = {};
        stats[c.block][c.vessel] = (stats[c.block][c.vessel] || 0) + 1;
      }
    }
    return stats;
  }, [containers, blockConfigs]);

  // ---------------- FILTER BY ISO TYPE ----------------
  const filteredContainers = useMemo(() => {
    if (isoTypeFilter === "ALL") return containers;

    const dryChars = ['G', 'P', 'T', 'L', 'U'];

    return containers.filter(c => {
      const iso = c.iso?.trim().toUpperCase();
      if (!iso || iso.length < 3) return false;

      const ch = iso[2];
      if (isoTypeFilter === "DRY") return dryChars.includes(ch);
      if (isoTypeFilter === "REEFER") return ch === "R";
      return true;
    });
  }, [containers, isoTypeFilter]);

  // ---------------- YARD STATISTICS ----------------
  const processedStats: BlockStats[] = useMemo(() => {
    const uniqueContainers = filteredContainers.filter(
      c => !(c.isMultiBay && c.partType === "end")
    );

    return blockConfigs.map(block => {
      const list = uniqueContainers.filter(c => c.block === block.name);
      const teus = (c: Container) => (c.size === 40 ? 2 : 1);

      const exp = list.filter(c => c.status === "FULL" && c.flow === "EXPORT");
      const imp = list.filter(c => c.status === "FULL" && c.flow === "IMPORT");
      const emp = list.filter(c => c.status === "EMPTY");

      return {
        name: block.name,
        group: block.group === "RỖNG" ? "GP" : block.group,
        capacity: block.capacity,
        exportFullTeus: exp.reduce((s, c) => s + teus(c), 0),
        importFullTeus: imp.reduce((s, c) => s + teus(c), 0),
        emptyTeus: emp.reduce((s, c) => s + teus(c), 0),
        exportFullCount: exp.length,
        importFullCount: imp.length,
        emptyCount: emp.length,
      };
    });
  }, [filteredContainers, blockConfigs]);

  // ---------------- RENDER ----------------
  return (
    <div className="min-h-screen text-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-full mx-auto">

        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-slate-900">Container Yard Viewer</h1>
          <p className="mt-2 text-lg text-slate-600">Upload an Excel file to visualize container positions.</p>
        </header>

        <main>
          <BlockConfigurator 
            blocks={blockConfigs}
            onAddBlock={handleAddBlock}
            onRemoveBlock={handleRemoveBlock}
          />

          {/* VIEW SWITCH */}
          <div className="flex justify-center mb-6 mt-6 space-x-2 p-1 bg-slate-200 rounded-lg">
            <button
              onClick={() => setView('map')}
              className={`px-4 py-2 text-sm font-semibold rounded-md ${
                view === 'map' ? 'bg-white text-blue-600 shadow' : 'bg-transparent text-slate-600 hover:bg-slate-300'
              }`}
            >
              Yard Map View
            </button>

            <button
              onClick={() => setView('stats')}
              disabled={containers.length === 0}
              className={`px-4 py-2 text-sm font-semibold rounded-md ${
                view === 'stats' ? 'bg-white text-blue-600 shadow' : 'bg-transparent text-slate-600 hover:bg-slate-300'
              } disabled:text-slate-400 disabled:cursor-not-allowed`}
            >
              Yard Statistics
            </button>
          </div>

          {/* MAIN VIEW */}
          {view === 'map' ? (
            <>
              {/* Upload + Filters */}
              <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-center">

                  {/* Upload */}
                  <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} />

                  {/* Search */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Highlight by Location or ID"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full p-3 pl-10 border-2 border-slate-200 rounded-lg"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                      🔍
                    </div>
                  </div>

                  {/* Vessel Filters */}
                  {vessels.length > 0 &&
                    FILTER_COLORS.map((color, index) => (
                      <div key={index} className="relative">
                        <span className={`absolute inset-y-0 left-0 pl-3 flex items-center`}>
                          <span className={`h-3 w-3 rounded-full ${color}`}></span>
                        </span>

                        <select
                          value={selectedVessels[index]}
                          onChange={e => handleVesselChange(index, e.target.value)}
                          className="w-full p-3 pl-8 border-2 border-slate-200 rounded-lg"
                        >
                          <option value="">{`Filter ${index + 1}`}</option>
                          {vessels.map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                </div>

                {/* Parse Status */}
                {error && (
                  <p className="text-center text-red-500 mt-4 font-semibold">{error}</p>
                )}

                {stats && !error && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
                    <p className="font-semibold">Processing Complete</p>
                    <ul className="list-disc list-inside ml-2">
                      <li>Total Rows: {stats.totalRows}</li>
                      <li>Containers Mapped: {stats.createdContainers}</li>
                      <li>Invalid Rows: {stats.skippedRows}</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Yard Map Rows */}
              <div className="space-y-6">
                {blockConfigs.map(config => (
                  <YardRowView
                    key={config.name}
                    label={config.name}
                    containers={containersByBlock[config.name] || []}
                    totalBays={config.totalBays}
                    rowsPerBay={config.rowsPerBay}
                    tiersPerBay={config.tiersPerBay}
                    highlightedContainerIds={highlightedContainerIds}
                    selectedVessels={selectedVessels}
                    filterColors={FILTER_COLORS}
                  />
                ))}
              </div>

              {/* Vessel Stats */}
              {containers.length > 0 && (
                <div className="mt-8">
                  <VesselStatistics
                    statsData={vesselStatsData}
                    vessels={vessels}
                    blocks={blockConfigs}
                  />
                </div>
              )}
            </>
          ) : (
            <YardStatistics
              data={processedStats}
              isoTypeFilter={isoTypeFilter}
              onFilterChange={setIsoTypeFilter}
            />
          )}

        </main>
      </div>
    </div>
  );
};

export default App;
