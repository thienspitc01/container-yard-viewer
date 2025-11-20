import * as XLSX from "xlsx";
import { supabase } from "./supabaseClient";

// Đọc file Excel → parse ra JSON
export const parseExcel = async (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(sheet);

        resolve(jsonData);
      } catch (err) {
        reject(err);
      }
    };

    reader.readAsArrayBuffer(file);
  });
};

// Lưu dữ liệu lên Supabase
export const saveYardDataOnline = async (data: any, filename: string) => {
  const { error } = await supabase.from("yard_data").insert([
    {
      filename,
      data,
    },
  ]);

  return { error };
};

// Lấy dữ liệu mới nhất từ Supabase
export const loadLatestYardData = async () => {
  const { data, error } = await supabase
    .from("yard_data")
    .select("*")
    .order("uploaded_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error loading data:", error);
    return null;
  }

  if (!data || data.length === 0) return null;

  return data[0].data;
};
