// ============================================================
//  EndoClinic settings template — copy to config.js if setting up fresh.
//  Never commit real private keys (service_role). The anon key is public
//  by design; data access is protected by Supabase RLS + disabled sign-ups.
// ============================================================
window.ENDO_CONFIG = {
  // 1) Supabase (online storage): Supabase → Project Settings → API.
  //    Leave empty to run in local-only "demo mode".
  supabaseUrl: '',
  supabaseAnonKey: '',

  // 2) Letterhead printed on the OPD sheet, Rx, and follow-up card
  clinic: {
    doctorName: 'Dr. Vijay Shripad Dhawle',
    qualifications: ['DCH DNB PEDIATRICS', 'Fellow in Pediatric Endocrinology', '(B.J. Wadia Hospital, Mumbai)'],
    regdNo: '81887',
    address: 'Address Latur Diabetes Centre, 1st Floor, Ashok Hotel Latur - 413512',
    phones: 'Tel. : 02382-250213, 255224, 9850631399.',
    greetingName: 'Dr. Dhawle',
  },
};
