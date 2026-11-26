// ============================================================
//  EndoClinic settings — the only file you need to edit.
// ============================================================
window.ENDO_CONFIG = {
  // 1) Supabase (online storage). Copy these two values from
  //    Supabase → Project Settings → API.  Leave empty to run in
  //    "demo mode" (data saved on this phone only).
  supabaseUrl: 'https://rquttouddmbksbitrykf.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxdXR0b3VkZG1ia3NiaXRyeWtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU3MDkyMTYsImV4cCI6MjExMTI4NTIxNn0.GPsnMmbbErxf4icfNDthxJ7Z-LpgGi_R7z0CwfkY3uI',

  // 2) Letterhead printed on the OPD sheet
  clinic: {
    doctorName: 'Dr. Vijay Shripad Dhawle',
    qualifications: ['DCH DNB PEDIATRICS', 'Fellow in Pediatric Endocrinology', '(B.J. Wadia Hospital, Mumbai)'],
    regdNo: '81887',
    address: 'Address Latur Diabetes Centre, 1st Floor, Ashok Hotel Latur - 413512',
    phones: 'Tel. : 02382-250213, 255224, 9850631399.',
    greetingName: 'Dr. Dhawle',
  },
};
