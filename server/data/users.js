/*  ============================================
    CLASS-PASS — Users Database
    ============================================  */

const teachers = [
  // CSE Department
  { uid: 'T001', name: 'Dr. Sharma', password: 'lpu2026', department: 'CSE', designation: 'Associate Professor', avatar: 'DS', email: 'sharma.cse@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T002', name: 'Prof. Gupta', password: 'lpu2026', department: 'CSE', designation: 'Professor', avatar: 'PG', email: 'gupta.cse@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T003', name: 'Dr. Verma', password: 'lpu2026', department: 'CSE', designation: 'Assistant Professor', avatar: 'DV', email: 'verma.cse@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T004', name: 'Prof. Singh', password: 'lpu2026', department: 'CSE', designation: 'Associate Professor', avatar: 'PS', email: 'singh.cse@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T005', name: 'Dr. Kaur', password: 'lpu2026', department: 'CSE', designation: 'Assistant Professor', avatar: 'DK', email: 'kaur.cse@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T006', name: 'Dr. Agarwal', password: 'lpu2026', department: 'CSE', designation: 'Professor', avatar: 'DA', email: 'agarwal.cse@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T007', name: 'Prof. Sinha', password: 'lpu2026', department: 'CSE', designation: 'Associate Professor', avatar: 'PS', email: 'sinha.cse@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T008', name: 'Dr. Mishra', password: 'lpu2026', department: 'CSE', designation: 'Assistant Professor', avatar: 'DM', email: 'mishra.cse@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T009', name: 'Dr. Roy', password: 'lpu2026', department: 'CSE', designation: 'Associate Professor', avatar: 'DR', email: 'roy.cse@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T010', name: 'Prof. Das', password: 'lpu2026', department: 'CSE', designation: 'Professor', avatar: 'PD', email: 'das.cse@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T011', name: 'Dr. Gill', password: 'lpu2026', department: 'CSE', designation: 'Assistant Professor', avatar: 'DG', email: 'gill.cse@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T012', name: 'Prof. Banerjee', password: 'lpu2026', department: 'CSE', designation: 'Professor', avatar: 'PB', email: 'banerjee.cse@lpu.in', phone: '+91-98765-xxxxx' },

  // IT Department
  { uid: 'T013', name: 'Prof. Nair', password: 'lpu2026', department: 'IT', designation: 'Associate Professor', avatar: 'PN', email: 'nair.it@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T014', name: 'Dr. Reddy', password: 'lpu2026', department: 'IT', designation: 'Assistant Professor', avatar: 'DR', email: 'reddy.it@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T015', name: 'Prof. Iyer', password: 'lpu2026', department: 'IT', designation: 'Professor', avatar: 'PI', email: 'iyer.it@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T016', name: 'Dr. Menon', password: 'lpu2026', department: 'IT', designation: 'Associate Professor', avatar: 'DM', email: 'menon.it@lpu.in', phone: '+91-98765-xxxxx' },

  // ECE Department
  { uid: 'T017', name: 'Dr. Patel', password: 'lpu2026', department: 'ECE', designation: 'Associate Professor', avatar: 'DP', email: 'patel.ece@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T018', name: 'Prof. Rao', password: 'lpu2026', department: 'ECE', designation: 'Professor', avatar: 'PR', email: 'rao.ece@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T019', name: 'Dr. Chatterjee', password: 'lpu2026', department: 'ECE', designation: 'Assistant Professor', avatar: 'DC', email: 'chatterjee.ece@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T020', name: 'Prof. Pillai', password: 'lpu2026', department: 'ECE', designation: 'Associate Professor', avatar: 'PP', email: 'pillai.ece@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T021', name: 'Dr. Saxena', password: 'lpu2026', department: 'ECE', designation: 'Professor', avatar: 'DS', email: 'saxena.ece@lpu.in', phone: '+91-98765-xxxxx' },

  // EEE Department
  { uid: 'T022', name: 'Dr. Bhat', password: 'lpu2026', department: 'EEE', designation: 'Associate Professor', avatar: 'DB', email: 'bhat.eee@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T023', name: 'Prof. Joshi', password: 'lpu2026', department: 'EEE', designation: 'Professor', avatar: 'PJ', email: 'joshi.eee@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T024', name: 'Dr. Kulkarni', password: 'lpu2026', department: 'EEE', designation: 'Assistant Professor', avatar: 'DK', email: 'kulkarni.eee@lpu.in', phone: '+91-98765-xxxxx' },

  // ME Department
  { uid: 'T025', name: 'Prof. Kumar', password: 'lpu2026', department: 'ME', designation: 'Professor', avatar: 'PK', email: 'kumar.me@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T026', name: 'Dr. Pandey', password: 'lpu2026', department: 'ME', designation: 'Associate Professor', avatar: 'DP', email: 'pandey.me@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T027', name: 'Prof. Thakur', password: 'lpu2026', department: 'ME', designation: 'Assistant Professor', avatar: 'PT', email: 'thakur.me@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T028', name: 'Dr. Srivastava', password: 'lpu2026', department: 'ME', designation: 'Professor', avatar: 'DS', email: 'srivastava.me@lpu.in', phone: '+91-98765-xxxxx' },

  // CE Department
  { uid: 'T029', name: 'Dr. Malhotra', password: 'lpu2026', department: 'CE', designation: 'Associate Professor', avatar: 'DM', email: 'malhotra.ce@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T030', name: 'Prof. Chauhan', password: 'lpu2026', department: 'CE', designation: 'Professor', avatar: 'PC', email: 'chauhan.ce@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T031', name: 'Dr. Tiwari', password: 'lpu2026', department: 'CE', designation: 'Assistant Professor', avatar: 'DT', email: 'tiwari.ce@lpu.in', phone: '+91-98765-xxxxx' },

  // MBA Department
  { uid: 'T032', name: 'Dr. Kapoor', password: 'lpu2026', department: 'MBA', designation: 'Professor', avatar: 'DK', email: 'kapoor.mba@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T033', name: 'Prof. Mehta', password: 'lpu2026', department: 'MBA', designation: 'Associate Professor', avatar: 'PM', email: 'mehta.mba@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T034', name: 'Dr. Arora', password: 'lpu2026', department: 'MBA', designation: 'Assistant Professor', avatar: 'DA', email: 'arora.mba@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T035', name: 'Prof. Batra', password: 'lpu2026', department: 'MBA', designation: 'Professor', avatar: 'PB', email: 'batra.mba@lpu.in', phone: '+91-98765-xxxxx' },

  // BBA
  { uid: 'T036', name: 'Dr. Dhillon', password: 'lpu2026', department: 'BBA', designation: 'Associate Professor', avatar: 'DD', email: 'dhillon.bba@lpu.in', phone: '+91-98765-xxxxx' },

  // Physics
  { uid: 'T037', name: 'Dr. Chandra', password: 'lpu2026', department: 'PHY', designation: 'Professor', avatar: 'DC', email: 'chandra.phy@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T038', name: 'Prof. Bhatt', password: 'lpu2026', department: 'PHY', designation: 'Associate Professor', avatar: 'PB', email: 'bhatt.phy@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T039', name: 'Dr. Rajan', password: 'lpu2026', department: 'PHY', designation: 'Assistant Professor', avatar: 'DR', email: 'rajan.phy@lpu.in', phone: '+91-98765-xxxxx' },

  // Chemistry
  { uid: 'T040', name: 'Prof. Dubey', password: 'lpu2026', department: 'CHM', designation: 'Professor', avatar: 'PD', email: 'dubey.chm@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T041', name: 'Dr. Anand', password: 'lpu2026', department: 'CHM', designation: 'Associate Professor', avatar: 'DA', email: 'anand.chm@lpu.in', phone: '+91-98765-xxxxx' },

  // Mathematics
  { uid: 'T042', name: 'Dr. Mukherjee', password: 'lpu2026', department: 'MTH', designation: 'Professor', avatar: 'DM', email: 'mukherjee.mth@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T043', name: 'Prof. Kashyap', password: 'lpu2026', department: 'MTH', designation: 'Associate Professor', avatar: 'PK', email: 'kashyap.mth@lpu.in', phone: '+91-98765-xxxxx' },

  // Biotechnology
  { uid: 'T044', name: 'Dr. Rastogi', password: 'lpu2026', department: 'BIO', designation: 'Associate Professor', avatar: 'DR', email: 'rastogi.bio@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T045', name: 'Prof. Hegde', password: 'lpu2026', department: 'BIO', designation: 'Professor', avatar: 'PH', email: 'hegde.bio@lpu.in', phone: '+91-98765-xxxxx' },

  // Architecture
  { uid: 'T046', name: 'Prof. Sethi', password: 'lpu2026', department: 'ARC', designation: 'Professor', avatar: 'PS', email: 'sethi.arc@lpu.in', phone: '+91-98765-xxxxx' },

  // Law
  { uid: 'T047', name: 'Dr. Venkatesh', password: 'lpu2026', department: 'LAW', designation: 'Associate Professor', avatar: 'DV', email: 'venkatesh.law@lpu.in', phone: '+91-98765-xxxxx' },

  // More CSE (we need plenty)
  { uid: 'T048', name: 'Dr. Prakash', password: 'lpu2026', department: 'CSE', designation: 'Assistant Professor', avatar: 'DP', email: 'prakash.cse@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T049', name: 'Prof. Mahajan', password: 'lpu2026', department: 'CSE', designation: 'Professor', avatar: 'PM', email: 'mahajan.cse@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T050', name: 'Dr. Nagpal', password: 'lpu2026', department: 'CSE', designation: 'Associate Professor', avatar: 'DN', email: 'nagpal.cse@lpu.in', phone: '+91-98765-xxxxx' },

  // More ECE
  { uid: 'T051', name: 'Prof. Bajaj', password: 'lpu2026', department: 'ECE', designation: 'Assistant Professor', avatar: 'PB', email: 'bajaj.ece@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T052', name: 'Dr. Goyal', password: 'lpu2026', department: 'ECE', designation: 'Associate Professor', avatar: 'DG', email: 'goyal.ece@lpu.in', phone: '+91-98765-xxxxx' },

  // More IT
  { uid: 'T053', name: 'Dr. Khanna', password: 'lpu2026', department: 'IT', designation: 'Assistant Professor', avatar: 'DK', email: 'khanna.it@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T054', name: 'Prof. Oberoi', password: 'lpu2026', department: 'IT', designation: 'Professor', avatar: 'PO', email: 'oberoi.it@lpu.in', phone: '+91-98765-xxxxx' },

  // More ME
  { uid: 'T055', name: 'Dr. Chopra', password: 'lpu2026', department: 'ME', designation: 'Associate Professor', avatar: 'DC', email: 'chopra.me@lpu.in', phone: '+91-98765-xxxxx' },

  // More CSE filling
  { uid: 'T056', name: 'Dr. Dhawan', password: 'lpu2026', department: 'CSE', designation: 'Assistant Professor', avatar: 'DD', email: 'dhawan.cse@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T057', name: 'Prof. Sandhu', password: 'lpu2026', department: 'CSE', designation: 'Associate Professor', avatar: 'PS', email: 'sandhu.cse@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T058', name: 'Dr. Mittal', password: 'lpu2026', department: 'CSE', designation: 'Professor', avatar: 'DM', email: 'mittal.cse@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T059', name: 'Prof. Tandon', password: 'lpu2026', department: 'IT', designation: 'Associate Professor', avatar: 'PT', email: 'tandon.it@lpu.in', phone: '+91-98765-xxxxx' },
  { uid: 'T060', name: 'Dr. Walia', password: 'lpu2026', department: 'ECE', designation: 'Assistant Professor', avatar: 'DW', email: 'walia.ece@lpu.in', phone: '+91-98765-xxxxx' },
]

const students = [
  { uid: '12312345', name: 'Surya Kumar', password: 'lpu2026', section: 'K22CS', program: 'B.Tech CSE', year: '2026', avatar: 'SK' },
  { uid: '12398765', name: 'Priya Sharma', password: 'lpu2026', section: 'K22EC', program: 'B.Tech ECE', year: '2026', avatar: 'PS' },
  { uid: '12345001', name: 'Aarav Patel', password: 'lpu2026', section: 'K22CS', program: 'B.Tech CSE', year: '2026', avatar: 'AP' },
  { uid: '12345002', name: 'Ishita Gupta', password: 'lpu2026', section: 'K22IT', program: 'B.Tech IT', year: '2026', avatar: 'IG' },
  { uid: '12345003', name: 'Rohan Singh', password: 'lpu2026', section: 'K22ME', program: 'B.Tech ME', year: '2026', avatar: 'RS' },
  { uid: '12345004', name: 'Ananya Reddy', password: 'lpu2026', section: 'K22EC', program: 'B.Tech ECE', year: '2026', avatar: 'AR' },
  { uid: '12345005', name: 'Vikram Joshi', password: 'lpu2026', section: 'K22CS', program: 'B.Tech CSE', year: '2026', avatar: 'VJ' },
  { uid: '12345006', name: 'Meera Iyer', password: 'lpu2026', section: 'K22EE', program: 'B.Tech EEE', year: '2026', avatar: 'MI' },
  { uid: '12345007', name: 'Arjun Nair', password: 'lpu2026', section: 'K22CE', program: 'B.Tech CE', year: '2026', avatar: 'AN' },
  { uid: '12345008', name: 'Kavya Mehta', password: 'lpu2026', section: 'K22CS', program: 'B.Tech CSE', year: '2026', avatar: 'KM' },
  { uid: '12345009', name: 'Rahul Verma', password: 'lpu2026', section: 'K23CS', program: 'B.Tech CSE', year: '2027', avatar: 'RV' },
  { uid: '12345010', name: 'Sneha Das', password: 'lpu2026', section: 'K23IT', program: 'B.Tech IT', year: '2027', avatar: 'SD' },
  { uid: '12345011', name: 'Aditya Kapoor', password: 'lpu2026', section: 'K23EC', program: 'B.Tech ECE', year: '2027', avatar: 'AK' },
  { uid: '12345012', name: 'Divya Thakur', password: 'lpu2026', section: 'K23ME', program: 'B.Tech ME', year: '2027', avatar: 'DT' },
  { uid: '12345013', name: 'Nikhil Pandey', password: 'lpu2026', section: 'K22CS', program: 'B.Tech CSE', year: '2026', avatar: 'NP' },
  { uid: '12345014', name: 'Pooja Chauhan', password: 'lpu2026', section: 'K22CS', program: 'B.Tech CSE', year: '2026', avatar: 'PC' },
  { uid: '12345015', name: 'Harsh Malhotra', password: 'lpu2026', section: 'K23CS', program: 'B.Tech CSE', year: '2027', avatar: 'HM' },
  { uid: '12345016', name: 'Ritika Arora', password: 'lpu2026', section: 'K22MB', program: 'MBA', year: '2026', avatar: 'RA' },
  { uid: '12345017', name: 'Karan Dhillon', password: 'lpu2026', section: 'K22CS', program: 'B.Tech CSE', year: '2026', avatar: 'KD' },
  { uid: '12345018', name: 'Neha Batra', password: 'lpu2026', section: 'K23EC', program: 'B.Tech ECE', year: '2027', avatar: 'NB' },
]

const admins = [
  { uid: 'A001', name: 'Admin', password: 'lpu2026', role: 'System Administrator', avatar: 'A' },
  { uid: 'A002', name: 'Dr. Dean', password: 'lpu2026', role: 'Dean of Engineering', avatar: 'DD' },
  { uid: 'A003', name: 'Campus Control', password: 'lpu2026', role: 'Infrastructure Manager', avatar: 'CC' },
]

module.exports = { teachers, students, admins }
