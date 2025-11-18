import React, { useState, useMemo, useEffect } from 'react';
import { Container, ParseStats, BlockConfig, VesselStatsData, BlockStats } from './types';
import { parseExcelFile } from './services/excelService';
import FileUpload from './components/FileUpload';
import YardRowView from './components/YardRowView';
import BlockConfigurator from './components/BlockConfigurator';
import VesselStatistics from './components/VesselStatistics';
import YardStatistics from './components/YardStatistics';

const DEFAULT_BLOCKS: BlockConfig[] = [
    // GP
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
    // RỖNG
    { name: 'B0', capacity: 1144, group: 'RỖNG', isDefault: true, totalBays: 35, rowsPerBay: 6, tiersPerBay: 6 },
    { name: 'C0', capacity: 940, group: 'RỖNG', isDefault: true, totalBays: 35, rowsPerBay: 6, tiersPerBay: 6 },
    { name: 'D0', capacity: 940, group: 'RỖNG', isDefault: true, totalBays: 35, rowsPerBay: 6, tiersPerBay: 6 },
    { name: 'E0', capacity: 840, group: 'RỖNG', isDefault: true, totalBays: 35, rowsPerBay: 6, tiersPerBay: 6 },
];

// A fixed, distinct color palette for the three vessel filters
const FILTER_COLORS = [
  'bg-sky-500', 
  'bg-lime-500', 
  'bg-amber-500',
];


const App: React.FC = () => {
  const [containers, setContainers] = useState<Container[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ParseStats | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [view, setView] = useState<'map' | 'stats'>('map');
  const [isoTypeFilter, setIsoTypeFilter] = useState<'ALL' | 'DRY' | 'REEFER'>('ALL');


  // New state for multiple vessel filtering
  const [vessels, setVessels] = useState<string[]>([]);
  const [selectedVessels, setSelectedVessels] = useState<string[]>(['', '', '']);

  // Dynamic yard configuration state
  const [blockConfigs, setBlockConfigs] = useState<BlockConfig[]>(() => {
    try {
      const savedConfigs = localStorage.getItem('yardBlockConfigs');
      return savedConfigs ? JSON.parse(savedConfigs) : DEFAULT_BLOCKS;
    } catch (e) {
      console.error("Failed to parse block configs from localStorage", e);
      return DEFAULT_BLOCKS;
    }
  });

  // Persist block configs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('yardBlockConfigs', JSON.stringify(blockConfigs));
    } catch (e) {
      console.error("Failed to save block configs to localStorage", e);
    }
  }, [blockConfigs]);
  
  const handleAddBlock = (newBlock: Omit<BlockConfig, 'isDefault'>) => {
    if (blockConfigs.some(b => b.name.toUpperCase() === newBlock.name.toUpperCase())) {
      alert(`Block with name "${newBlock.name}" already exists.`);
      return;
    }
    setBlockConfigs(prev => [...prev, { ...newBlock, isDefault: false }]);
  };

  const handleRemoveBlock = (blockName: string) => {
    setBlockConfigs(prev => prev.filter(b => b.name !== blockName));
  };


  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setStats(null);
    setVessels([]);
    setSelectedVessels(['', '', '']);

    try {
      const { containers: parsedData, stats: parseStats, vessels: parsedVessels } = await parseExcelFile(file);
      setContainers(parsedData);
      setStats(parseStats);
      setVessels(parsedVessels);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setContainers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVesselChange = (index: number, vessel: string) => {
    const newSelectedVessels = [...selectedVessels];
    newSelectedVessels[index] = vessel;
    setSelectedVessels(newSelectedVessels);
  };
  
  const containersByBlock = useMemo(() => {
    return containers.reduce((acc, container) => {
        if (!acc[container.block]) {
            acc[container.block] = [];
        }
        acc[container.block].push(container);
        return acc;
    }, {} as Record<string, Container[]>);
  }, [containers]);

  const highlightedContainerIds = useMemo(() => {
    const trimmedSearch = searchTerm.trim().toUpperCase();
    if (!trimmedSearch) {
        return new Set<string>();
    }
    
    const normalizedSearchForLocation = trimmedSearch.replace(/-/g, '');

    const matchingContainers = containers.filter(c => {
        const normalizedLocation = c.location.replace(/\s/g, '').replace(/-/g, '');
        // Match if container ID includes the search term OR if the normalized location matches exactly
        return c.id.toUpperCase().includes(trimmedSearch) || normalizedLocation === normalizedSearchForLocation;
    });

    return new Set(matchingContainers.map(c => c.id));
  }, [searchTerm, containers]);

  const vesselStatsData = useMemo(() => {
    const stats: VesselStatsData = {};
    // Initialize stats object with all blocks
    for (const block of blockConfigs) {
      stats[block.name] = {};
    }

    // Populate stats
    for (const container of containers) {
      if (container.vessel) {
        // Only count the 'start' part of a 40' container to avoid double-counting
        if (container.isMultiBay && container.partType === 'end') {
          continue;
        }
        if (!stats[container.block]) {
          stats[container.block] = {};
        }
        if (!stats[container.block][container.vessel]) {
          stats[container.block][container.vessel] = 0;
        }
        stats[container.block][container.vessel]++;
      }
    }
    return stats;
  }, [containers, blockConfigs]);

  const filteredContainers = useMemo(() => {
    if (isoTypeFilter === 'ALL') {
      return containers;
    }

    const dryChars = ['G', 'P', 'T', 'L', 'U'];

    return containers.filter(c => {
      const iso = c.iso?.trim().toUpperCase();
      if (!iso || iso.length < 3) {
        return false;
      }
      const typeChar = iso[2];

      if (isoTypeFilter === 'DRY') {
        return dryChars.includes(typeChar);
      }
      if (isoTypeFilter === 'REEFER') {
        return typeChar === 'R';
      }
      return true;
    });
  }, [containers, isoTypeFilter]);


  const processedStats: BlockStats[] = useMemo(() => {
    // Filter out the 'end' part of 40' containers to avoid double counting TEUs
    const uniqueContainers = filteredContainers.filter(c => !(c.isMultiBay && c.partType === 'end'));
    
    return blockConfigs.map(block => {
      const blockContainers = uniqueContainers.filter(c => c.block === block.name);
      
      const getTeus = (c: Container) => c.size === 40 ? 2 : 1;
      
      const exportFullContainers = blockContainers.filter(c => c.status === 'FULL' && c.flow === 'EXPORT');
      const importFullContainers = blockContainers.filter(c => c.status === 'FULL' && c.flow === 'IMPORT');
      const emptyContainers = blockContainers.filter(c => c.status === 'EMPTY');
      
      const exportFullTeus = exportFullContainers.reduce((sum, c) => sum + getTeus(c), 0);
      const importFullTeus = importFullContainers.reduce((sum, c) => sum + getTeus(c), 0);
      const emptyTeus = emptyContainers.reduce((sum, c) => sum + getTeus(c), 0);
      
      return {
        name: block.name,
        group: block.group === 'RỖNG' ? 'GP' : (block.group || 'N/A'),
        capacity: block.capacity || 0,
        exportFullTeus,
        importFullTeus,
        emptyTeus,
        exportFullCount: exportFullContainers.length,
        importFullCount: importFullContainers.length,
        emptyCount: emptyContainers.length,
      };
    });
  }, [filteredContainers, blockConfigs]);


  return (
    <div className="min-h-screen text-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-full mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Container Yard Viewer</h1>
          <p className="mt-2 text-lg text-slate-600">Upload an Excel file to visualize container positions in the yard.</p>
        </header>

        <main>
          <BlockConfigurator 
            blocks={blockConfigs}
            onAddBlock={handleAddBlock}
            onRemoveBlock={handleRemoveBlock}
          />

          <div className="flex justify-center mb-6 mt-6 space-x-2 p-1 bg-slate-200 rounded-lg">
              <button
                  onClick={() => setView('map')}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
                      view === 'map' ? 'bg-white text-blue-600 shadow' : 'bg-transparent text-slate-600 hover:bg-slate-300'
                  }`}
              >
                  Yard Map View
              </button>
              <button
                  onClick={() => setView('stats')}
                  disabled={containers.length === 0}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
                      view === 'stats' ? 'bg-white text-blue-600 shadow' : 'bg-transparent text-slate-600 hover:bg-slate-300'
                  } disabled:text-slate-400 disabled:cursor-not-allowed disabled:hover:bg-transparent`}
              >
                  Yard Statistics
              </button>
          </div>
        
          {view === 'map' && (
            <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-center">
                  <div className="lg:col-span-1">
                    <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} />
                  </div>
                  <div className="relative lg:col-span-1">
                    <label htmlFor="search-location" className="sr-only">Highlight Location or Container ID</label>
                    <input
                      id="search-location"
                      type="text"
                      placeholder="Highlight by Location or ID"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full p-3 pl-10 border-2 border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Vessel Filters */}
                  {vessels.length > 0 && FILTER_COLORS.map((color, index) => (
                      <div key={index} className="relative lg:col-span-1">
                        <label htmlFor={`vessel-filter-${index}`} className="sr-only">{`Filter by Vessel ${index + 1}`}</label>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className={`h-3 w-3 rounded-full ${color} border border-slate-400/50`}></span>
                        </div>
                         <select
                           id={`vessel-filter-${index}`}
                           value={selectedVessels[index]}
                           onChange={(e) => handleVesselChange(index, e.target.value)}
                           className="w-full p-3 pl-8 border-2 border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition appearance-none"
                         >
                           <option value="">{`Filter ${index + 1}`}</option>
                           {vessels.map(vessel => (
                             <option key={vessel} value={vessel}>{vessel}</option>
                           ))}
                         </select>
                      </div>
                  ))}
              </div>
              {error && <p className="text-center text-red-500 mt-4 font-semibold">{error}</p>}
              {stats && !error && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
                    <p className="font-semibold">Processing Complete</p>
                    <ul className="list-disc list-inside ml-2">
                        <li>Total Rows in File: {stats.totalRows}</li>
                        <li>Containers Mapped: {stats.createdContainers}</li>
                        <li>Rows Skipped (invalid format): {stats.skippedRows}</li>
                    </ul>
                </div>
              )}
            </div>
          )}

          {view === 'map' ? (
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
           ) : (
            <YardStatistics 
              data={processedStats} 
              isoTypeFilter={isoTypeFilter} 
              onFilterChange={setIsoTypeFilter}
            />
           )}

          {containers.length > 0 && view === 'map' && (
            <div className="mt-8">
              <VesselStatistics
                statsData={vesselStatsData}
                vessels={vessels}
                blocks={blockConfigs}
              />
            </div>
          )}

          {containers.length === 0 && !isLoading && (
            <div className="mt-12 text-center">
              <div className="bg-white p-10 rounded-xl shadow-lg inline-block">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-slate-900">Yard is empty</h3>
                <p className="mt-1 text-sm text-slate-500">Upload a file to see container data.</p>
                 <div className="mt-4 text-left text-xs text-slate-400 bg-slate-50 p-3 rounded-md">
                    <p className="font-semibold">Expected Excel Columns:</p>
                    <ul className="list-disc list-inside">
                        <li><b>Location:</b> <span className="font-mono">Vị trí trên bãi</span>, <span className="font-mono">Vị trí</span>, or <span className="font-mono">Location</span></li>
                        <li><b>Status:</b> <span className="font-mono">Trạng thái</span> (e.g., 'F' for Full, 'E' for Empty)</li>
                        <li><b>Flow:</b> <span className="font-mono">Hướng</span> (e.g., 'IM' for Import, 'EX' for Export)</li>
                        <li><b>ISO Code:</b> <span className="font-mono">Loại ISO</span> (e.g., '22G1', '45R1')</li>
                        <li><b>Owner:</b> <span className="font-mono">Hãng khai thác</span> or <span className="font-mono">Owner</span></li>
                        <li><b>Container No:</b> <span className="font-mono">Số cont</span> or <span className="font-mono">Container</span></li>
                        <li><b>Vessel:</b> <span className="font-mono">Tên tàu</span> or <span className="font-mono">Vessel</span></li>
                    </ul>
                    <p className="mt-2 text-slate-500">
                      <b>Location Format:</b> <span className="font-mono">BLOCK-BAY-ROW-TIER</span> (e.g., <span className="font-mono">A2-21-05-1</span> or <span className="font-mono">A221051</span>).
                    </p>
                 </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;