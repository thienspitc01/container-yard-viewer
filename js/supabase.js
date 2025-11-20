// Kết nối Supabase
const SUPABASE_URL = "https://rfdclklazfxjrjffatqj.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmZGNsa2xhemZ4anJqZmZhdHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NTY1NDYsImV4cCI6MjA3OTAzMjU0Nn0.n7V5-Baxie-XKfTXSLYqlI4piWC4SRnDvxSO8qS4_8c";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Hàm lấy toàn bộ dữ liệu container
async function loadContainers() {
    const { data, error } = await db.from("containers").select("*");
    if (error) {
        console.error("Error loading data:", error);
        return [];
    }
    return data;
}

// Hàm thêm container mới
async function addContainer(containerData) {
    const { data, error } = await db.from("containers").insert([containerData]);
    if (error) {
        console.error("Insert error:", error);
        return null;
    }
    return data;
}

// Hàm cập nhật container
async function updateContainer(id, updateData) {
    const { data, error } = await db.from("containers").update(updateData).eq("id", id);
    if (error) {
        console.error("Update error:", error);
        return null;
    }
    return data;
}

// Hàm xóa container
async function deleteContainer(id) {
    const { data, error } = await db.from("containers").delete().eq("id", id);
    if (error) {
        console.error("Delete error:", error);
        return null;
    }
    return data;
}
