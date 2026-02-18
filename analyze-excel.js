const XLSX = require('xlsx');

// Excel dosyasını oku
const workbook = XLSX.readFile('Ornek_Veri_Seti_final.xlsx');

// Sheet isimlerini göster
console.log('Sheet isimleri:', workbook.SheetNames);

// İlk sheet'i al
const firstSheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[firstSheetName];

// JSON'a çevir
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('\n--- Veri Yapısı ---');
console.log('Toplam satır sayısı:', data.length);
console.log('\nİlk 3 satır:');
console.log(JSON.stringify(data.slice(0, 3), null, 2));

console.log('\n--- Sütunlar ---');
if (data.length > 0) {
  console.log(Object.keys(data[0]));
}

// Özet istatistikler
console.log('\n--- Özet İstatistikler ---');
if (data.length > 0) {
  const keys = Object.keys(data[0]);
  keys.forEach(key => {
    const uniqueValues = [...new Set(data.map(row => row[key]))];
    console.log(`${key}: ${uniqueValues.length} benzersiz değer`);
  });
}
