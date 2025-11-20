import React, { useEffect, useState } from "react";
import FileUpload from "./components/FileUpload";
import YardRowView from "./components/YardRowView";
import { loadLatestYardData } from "./services/excelService";

const App = () => {
  const [yardData, setYardData] = useState<any[]>([]);

  // Khi mở web → lấy dữ liệu mới nhất từ Supabase
  useEffect(() => {
    const fetchData = async () => {
      const latest = await loadLatestYardData();
      if (latest) {
        setYardData(latest);
        console.log("Loaded from Supabase:", latest);
      }
    };

    fetchData();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Container Yard Viewer</h2>

      {/* Phần upload file */}
      <FileUpload onDataLoaded={setYardData} />

      {/* Phần hiển thị dữ liệu đã parse */}
      <div style={{ marginTop: 20 }}>
        {yardData.length > 0 ? (
          <YardRowView data={yardData} />
        ) : (
          <p>📭 Chưa có dữ liệu. Vui lòng upload file Excel.</p>
        )}
      </div>
    </div>
  );
};

export default App;
