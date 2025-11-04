'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

// Definisikan tipe untuk item menu agar kode lebih aman dan terstruktur
interface MenuItem {
  id: number;
  name: string;
  Description: string | null;
  Price: number; // Asumsi Price disimpan sebagai angka di Supabase
  imageUrl: string | null; // URL gambar menu
}

// Fungsi Utilitas sederhana untuk memformat harga
// SOLUSI: Tentukan tipe data price secara eksplisit (string atau number)
const formatPrice = (price: string | number): string => {
  const num = Number(price);
  if (isNaN(num)) return 'N/A';
  // Menggunakan 'Rp' dan pemisah ribuan
  return num.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
};

export default function Home() {
  // --- STATE (Ditambahkan Tipe Data) ---
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [itemName, setItemName] = useState('')
  const [itemDescription, setItemDescription] = useState('')
  // itemPrice diikat ke input type="number", jadi kita gunakan string untuk state-nya
  const [itemPrice, setItemPrice] = useState<string>('') 
  const [imageUrl, setImageUrl] = useState<string>('')
  const [editingId, setEditingId] = useState<number | null>(null) 

  // --- FUNGSI CRUD & UTILITY ---
  const fetchMenu = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('menu')
      .select('id, name, Description, Price, imageUrl') // Menambahkan imageUrl ke query
      .order('id', { ascending: true }) 
    
    if (error) {
      console.error('❌ Gagal mengambil data:', error.message)
      setError(error.message)
      setMenuItems([])
    } else {
      setMenuItems(data as MenuItem[]) // Type-casting data
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMenu() 
  }, [fetchMenu])

  async function handleSubmit() {
    if (!itemName || !itemPrice) {
      alert('Nama dan Harga tidak boleh kosong!')
      return
    }
    
    // Konversi itemPrice menjadi Number untuk Supabase (jika kolom Price di DB adalah numeric)
    const priceValue = Number(itemPrice);
    if (isNaN(priceValue)) {
      alert('Harga harus berupa angka yang valid!');
      return;
    }
    
    setLoading(true)
    let error
    
    if (editingId) {
      // MODE UPDATE
      const { error: updateError } = await supabase
        .from('menu')
        .update({ 
          name: itemName, 
          Description: itemDescription, 
          Price: priceValue,
          imageUrl: imageUrl || null 
        })
        .eq('id', editingId)
      error = updateError
    } else {
      // MODE CREATE
      const { error: createError } = await supabase
        .from('menu')
        .insert({ 
          name: itemName, 
          Description: itemDescription, 
          Price: priceValue,
          imageUrl: imageUrl || null 
        })
      error = createError
    }

    if (error) {
      console.error('❌ Gagal simpan data:', error.message)
      alert(`Gagal ${editingId ? 'Update' : 'Tambah'} data: ${error.message}`)
    } else {
      resetForm()
      await fetchMenu()
    }
    setLoading(false)
  }

  async function deleteItem(id: number) { // Tambahkan tipe number
    if (window.confirm('Yakin ingin menghapus item ini?')) {
      setLoading(true)
      const { error } = await supabase
        .from('menu')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('❌ Gagal hapus data:', error.message)
        alert('Gagal hapus data: ' + error.message)
      } else {
        await fetchMenu() 
      }
      setLoading(false)
    }
  }

  function editItem(item: MenuItem) { // Tambahkan tipe MenuItem
    setItemName(item.name)
    setItemDescription(item.Description || '')
    // Konversi Price kembali menjadi string untuk di-set ke input type="number"
    setItemPrice(String(item.Price))
    setImageUrl(item.imageUrl || '')
    setEditingId(item.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setItemName('')
    setItemDescription('')
    setItemPrice('')
    setImageUrl('')
    setEditingId(null)
  }

  // --- RENDERING (Tampilan) ---
  return (
    <main className="p-5 md:p-10 text-center max-w-xl mx-auto min-h-screen bg-gray-50">
      <h1 className="text-4xl font-extrabold text-blue-700 mb-10">
        Manajemen Menu Makanan 🍽️
      </h1>

      {/* --- FORM INPUT (CREATE/UPDATE) --- */}
      <div className="bg-white border-t-4 border-blue-500 p-6 rounded-xl shadow-lg mb-10 text-left">
        <h2 className="text-2xl font-bold text-gray-800 mb-5 border-b pb-2">
          {editingId ? '✏️ Edit Item Menu' : '➕ Tambah Item Baru'}
        </h2>
        
        {/* Nama Item */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Item:</label>
          <input 
            type="text" 
            value={itemName} 
            onChange={(e) => setItemName(e.target.value)} 
            placeholder="Nasi Goreng Spesial..."
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            disabled={loading}
          />
        </div>
        
        {/* Harga */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Numeric):</label>
          <input 
            type="number" 
            value={itemPrice} 
            onChange={(e) => setItemPrice(e.target.value)} 
            placeholder="Contoh: 25000"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            disabled={loading}
          />
        </div>
        
        {/* Deskripsi */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi:</label>
          <textarea 
            value={itemDescription} 
            onChange={(e) => setItemDescription(e.target.value)} 
            placeholder="Deskripsi singkat, bahan, atau catatan..."
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            disabled={loading}
          />
        </div>

        {/* URL Gambar */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">URL Gambar:</label>
          <input 
            type="url" 
            value={imageUrl} 
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/gambar-menu.jpg"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            disabled={loading}
          />
        </div>

        {/* Tombol Submit & Batal */}
        <div className="flex justify-end gap-3">
          {editingId && (
            <button 
              onClick={resetForm} 
              className="px-4 py-2 bg-gray-400 text-white font-medium rounded-lg hover:bg-gray-500 transition duration-150 disabled:opacity-50"
              disabled={loading}
            >
              Batal Edit
            </button>
          )}
          <button 
            onClick={handleSubmit} 
            className={`px-4 py-2 text-white font-semibold rounded-lg transition duration-150 disabled:opacity-50 ${
              editingId 
                ? 'bg-orange-500 hover:bg-orange-600'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={loading}
          >
            {loading ? 'Memproses...' : editingId ? '💾 Simpan Perubahan' : '➕ Tambah Item'}
          </button>
        </div>
      </div>

      {/* --- DAFTAR DATA (READ) --- */}
      <h2 className="text-3xl font-bold text-gray-800 mb-6 mt-10 border-b-2 border-blue-500 pb-2">Daftar Menu Saat Ini</h2>
      
      {loading && <p className="text-blue-600 font-semibold mt-4">Mengambil data...</p>}
      
      {error && <p className="text-red-500 mt-4 font-medium">⚠️ Error: {error}</p>}

      {!loading && !error && (
        <div className="text-left">
          {menuItems.length > 0 ? (
            <ul className="space-y-4">
              {menuItems.map((item) => (
                <li 
                  key={item.id} 
                  className="bg-white border-l-4 border-blue-400 p-4 rounded-xl shadow-md hover:shadow-lg transition duration-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-blue-700">
                        {item.name}
                      </h3>
                      <div className="text-lg font-extrabold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200 inline-block mt-2">
                        {formatPrice(item.Price)} 
                      </div>
                    </div>
                    {item.imageUrl && (
                      <img 
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded-lg ml-4"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/150?text=No+Image';
                        }}
                      />
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-3 pl-3">
                    {item.Description || 'Tidak ada deskripsi.'}
                  </p>
                  
                  {/* Tombol Aksi */}
                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={() => editItem(item)} 
                      className="px-3 py-1 text-sm bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition disabled:opacity-50"
                      disabled={loading}
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => deleteItem(item.id)} 
                      className="px-3 py-1 text-sm bg-red-500 text-white font-medium rounded-md hover:bg-red-600 transition disabled:opacity-50"
                      disabled={loading}
                    >
                      🗑️ Hapus
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 mt-4">Tidak ada data menu yang ditemukan. Silakan tambahkan item baru.</p>
          )}
        </div>
      )}
    </main>
  )
}