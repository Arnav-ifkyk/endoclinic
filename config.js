// ============================================================
//  EndoClinic settings — the only file you need to edit.
// ============================================================
window.ENDO_CONFIG = {
  // 1) Supabase (online storage). Copy these two values from
  //    Supabase → Project Settings → API.  Leave empty to run in
  //    "demo mode" (data saved on this phone only).
  supabaseUrl: 'https://rquttouddmbksbitrykf.supabase.co',
  supabaseAnonKey: 'sb_publishable_BPAfRaRk7Z_JAasDQqvbcA_4LiGALsr',

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
