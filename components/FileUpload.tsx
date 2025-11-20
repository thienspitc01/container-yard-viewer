import React from "react";
import { parseExcel, saveYardDataOnline } from "../services/excelService";

interface Props {
  onDataLoaded: (data: any) => void;
}

const FileUpload: React.FC<Props> = ({ onDataLoaded }) => {
  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 1. Parse file Excel → lấy dữ liệu JSON
    const parsed = await parseExcel(file);

    // 2. Gửi dữ liệu JSON lên App để hiển thị ngay
    onDataLoaded(parsed);

    // 3. Lưu dữ liệu lên Supabase (team xem được)
    const { error } = await saveYardDataOnline(parsed, file.name);

    if (error) {
      alert("❌ Lỗi khi lưu dữ liệu lên server Supabase!");
      console.error(error);
    } else {
      alert("✔ File được upload & lưu online thành công!");
    }
  };

  return (
    <div>
      <input type="file" accept=".xlsx,.xls" onChange={handleFile} />
    </div>
  );
};

export default FileUpload;
