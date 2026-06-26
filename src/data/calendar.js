// Dummy calendar events
const today = new Date()
const year = today.getFullYear()
const month = today.getMonth()
const day = today.getDate()

function d(dayOffset, hour, minute = 0) {
  const date = new Date(year, month, day + dayOffset, hour, minute)
  return date.toISOString()
}

export const calendarEvents = [
  // Today
  {
    id: 'evt-001',
    title: 'Kuliah Kecerdasan Buatan',
    start: d(0, 8, 0),
    end: d(0, 10, 0),
    category: 'akademik',
    color: 'blue',
    location: 'Ruang F3.1 Filkom',
    rrule: true,
    description: 'Materi: Neural Networks & Deep Learning. Bawa laptop.',
  },
  {
    id: 'evt-002',
    title: 'Coding Project Web AI',
    start: d(0, 10, 30),
    end: d(0, 12, 30),
    category: 'coding',
    color: 'green',
    location: 'Lab Komputer Lt. 2',
    rrule: false,
    description: 'Sprint: Implementasi frontend PWA Life-OS dashboard.',
  },
  {
    id: 'evt-003',
    title: 'Makan Siang',
    start: d(0, 12, 30),
    end: d(0, 13, 30),
    category: 'personal',
    color: 'yellow',
    location: 'Kantin Filkom',
    rrule: true,
    description: 'Istirahat & makan siang.',
  },
  {
    id: 'evt-004',
    title: 'Praktikum Basis Data',
    start: d(0, 14, 0),
    end: d(0, 16, 0),
    category: 'akademik',
    color: 'blue',
    location: 'Lab DB Filkom',
    rrule: true,
    description: 'Praktikum modul 8: Indexing & Query Optimization.',
  },
  {
    id: 'evt-005',
    title: 'Deadline Tugas AI',
    start: d(0, 23, 59),
    end: d(0, 23, 59),
    category: 'deadline',
    color: 'red',
    location: 'Submit via LMS',
    rrule: false,
    description: 'Deadline pengumpulan tugas Neural Network Classification. Upload ke LMS.',
  },
  // Tomorrow
  {
    id: 'evt-006',
    title: 'Meeting Tim Capstone',
    start: d(1, 9, 0),
    end: d(1, 11, 0),
    category: 'meeting',
    color: 'purple',
    location: 'Zoom Meeting',
    rrule: false,
    description: 'Diskusi progress capstone project. Presentasi bagian masing-masing.',
  },
  {
    id: 'evt-007',
    title: 'Kuliah Rekayasa Perangkat Lunak',
    start: d(1, 13, 0),
    end: d(1, 15, 0),
    category: 'akademik',
    color: 'blue',
    location: 'Ruang F2.3 Filkom',
    rrule: true,
    description: 'Materi: Agile & Scrum Framework.',
  },
  {
    id: 'evt-008',
    title: 'Gym Session',
    start: d(1, 17, 0),
    end: d(1, 18, 30),
    category: 'personal',
    color: 'cyan',
    location: 'GOR UB',
    rrule: true,
    description: 'Upper body day. Bench press, shoulder press, pull ups.',
  },
  // Day after tomorrow
  {
    id: 'evt-009',
    title: 'Freelance Client Call',
    start: d(2, 10, 0),
    end: d(2, 11, 0),
    category: 'meeting',
    color: 'purple',
    location: 'Google Meet',
    rrule: false,
    description: 'Review progress landing page dengan Pak Andi.',
  },
  {
    id: 'evt-010',
    title: 'Kuliah Kecerdasan Buatan',
    start: d(2, 8, 0),
    end: d(2, 10, 0),
    category: 'akademik',
    color: 'blue',
    location: 'Ruang F3.1 Filkom',
    rrule: true,
    description: 'Materi: Convolutional Neural Networks.',
  },
  // Yesterday
  {
    id: 'evt-011',
    title: 'Study Group Algoritma',
    start: d(-1, 19, 0),
    end: d(-1, 21, 0),
    category: 'akademik',
    color: 'blue',
    location: 'Perpustakaan UB',
    rrule: false,
    description: 'Belajar bareng graph algorithms untuk UTS.',
  },
  {
    id: 'evt-012',
    title: 'Nonton Film Bareng',
    start: d(-1, 21, 30),
    end: d(-1, 23, 30),
    category: 'personal',
    color: 'pink',
    location: 'CGV Mall Dinoyo',
    rrule: false,
    description: 'Nonton film sama teman-teman.',
  },
]

export const categoryColors = {
  akademik: { bg: 'event-blue', label: 'Akademik', icon: 'GraduationCap' },
  coding: { bg: 'event-green', label: 'Coding', icon: 'Code' },
  personal: { bg: 'event-yellow', label: 'Personal', icon: 'Target' },
  deadline: { bg: 'event-red', label: 'Deadline', icon: 'AlertCircle' },
  meeting: { bg: 'event-purple', label: 'Meeting', icon: 'Users' },
}
