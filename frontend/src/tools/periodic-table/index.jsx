import { useState, useRef, useEffect } from 'react'

// ─── Element data ─────────────────────────────────────────────────────────────
// { z, s=symbol, n=name, m=mass, c=category, p=period, g=group,
//   dr=displayRow(f-block), dc=displayCol(f-block), e=econfig, en=electronegativity, st=state }

const ELEMENTS = [
  // Period 1
  { z:1,   s:'H',  n:'Hydrogen',       m:1.008,   c:'H',  p:1, g:1,  e:'1s¹',                       en:2.20, st:'g' },
  { z:2,   s:'He', n:'Helium',         m:4.003,   c:'Ng', p:1, g:18, e:'1s²',                       en:null, st:'g' },
  // Period 2
  { z:3,   s:'Li', n:'Lithium',        m:6.941,   c:'Al', p:2, g:1,  e:'[He] 2s¹',                  en:0.98, st:'s' },
  { z:4,   s:'Be', n:'Beryllium',      m:9.012,   c:'Ae', p:2, g:2,  e:'[He] 2s²',                  en:1.57, st:'s' },
  { z:5,   s:'B',  n:'Boron',          m:10.81,   c:'Mt', p:2, g:13, e:'[He] 2s² 2p¹',              en:2.04, st:'s' },
  { z:6,   s:'C',  n:'Carbon',         m:12.011,  c:'Nm', p:2, g:14, e:'[He] 2s² 2p²',              en:2.55, st:'s' },
  { z:7,   s:'N',  n:'Nitrogen',       m:14.007,  c:'Nm', p:2, g:15, e:'[He] 2s² 2p³',              en:3.04, st:'g' },
  { z:8,   s:'O',  n:'Oxygen',         m:15.999,  c:'Nm', p:2, g:16, e:'[He] 2s² 2p⁴',              en:3.44, st:'g' },
  { z:9,   s:'F',  n:'Fluorine',       m:18.998,  c:'Ha', p:2, g:17, e:'[He] 2s² 2p⁵',              en:3.98, st:'g' },
  { z:10,  s:'Ne', n:'Neon',           m:20.180,  c:'Ng', p:2, g:18, e:'[He] 2s² 2p⁶',              en:null, st:'g' },
  // Period 3
  { z:11,  s:'Na', n:'Sodium',         m:22.990,  c:'Al', p:3, g:1,  e:'[Ne] 3s¹',                  en:0.93, st:'s' },
  { z:12,  s:'Mg', n:'Magnesium',      m:24.305,  c:'Ae', p:3, g:2,  e:'[Ne] 3s²',                  en:1.31, st:'s' },
  { z:13,  s:'Al', n:'Aluminium',      m:26.982,  c:'Pt', p:3, g:13, e:'[Ne] 3s² 3p¹',              en:1.61, st:'s' },
  { z:14,  s:'Si', n:'Silicon',        m:28.086,  c:'Mt', p:3, g:14, e:'[Ne] 3s² 3p²',              en:1.90, st:'s' },
  { z:15,  s:'P',  n:'Phosphorus',     m:30.974,  c:'Nm', p:3, g:15, e:'[Ne] 3s² 3p³',              en:2.19, st:'s' },
  { z:16,  s:'S',  n:'Sulfur',         m:32.06,   c:'Nm', p:3, g:16, e:'[Ne] 3s² 3p⁴',              en:2.58, st:'s' },
  { z:17,  s:'Cl', n:'Chlorine',       m:35.45,   c:'Ha', p:3, g:17, e:'[Ne] 3s² 3p⁵',              en:3.16, st:'g' },
  { z:18,  s:'Ar', n:'Argon',          m:39.948,  c:'Ng', p:3, g:18, e:'[Ne] 3s² 3p⁶',              en:null, st:'g' },
  // Period 4
  { z:19,  s:'K',  n:'Potassium',      m:39.098,  c:'Al', p:4, g:1,  e:'[Ar] 4s¹',                  en:0.82, st:'s' },
  { z:20,  s:'Ca', n:'Calcium',        m:40.078,  c:'Ae', p:4, g:2,  e:'[Ar] 4s²',                  en:1.00, st:'s' },
  { z:21,  s:'Sc', n:'Scandium',       m:44.956,  c:'Tm', p:4, g:3,  e:'[Ar] 3d¹ 4s²',              en:1.36, st:'s' },
  { z:22,  s:'Ti', n:'Titanium',       m:47.867,  c:'Tm', p:4, g:4,  e:'[Ar] 3d² 4s²',              en:1.54, st:'s' },
  { z:23,  s:'V',  n:'Vanadium',       m:50.942,  c:'Tm', p:4, g:5,  e:'[Ar] 3d³ 4s²',              en:1.63, st:'s' },
  { z:24,  s:'Cr', n:'Chromium',       m:51.996,  c:'Tm', p:4, g:6,  e:'[Ar] 3d⁵ 4s¹',              en:1.66, st:'s' },
  { z:25,  s:'Mn', n:'Manganese',      m:54.938,  c:'Tm', p:4, g:7,  e:'[Ar] 3d⁵ 4s²',              en:1.55, st:'s' },
  { z:26,  s:'Fe', n:'Iron',           m:55.845,  c:'Tm', p:4, g:8,  e:'[Ar] 3d⁶ 4s²',              en:1.83, st:'s' },
  { z:27,  s:'Co', n:'Cobalt',         m:58.933,  c:'Tm', p:4, g:9,  e:'[Ar] 3d⁷ 4s²',              en:1.88, st:'s' },
  { z:28,  s:'Ni', n:'Nickel',         m:58.693,  c:'Tm', p:4, g:10, e:'[Ar] 3d⁸ 4s²',              en:1.91, st:'s' },
  { z:29,  s:'Cu', n:'Copper',         m:63.546,  c:'Tm', p:4, g:11, e:'[Ar] 3d¹⁰ 4s¹',             en:1.90, st:'s' },
  { z:30,  s:'Zn', n:'Zinc',           m:65.38,   c:'Tm', p:4, g:12, e:'[Ar] 3d¹⁰ 4s²',             en:1.65, st:'s' },
  { z:31,  s:'Ga', n:'Gallium',        m:69.723,  c:'Pt', p:4, g:13, e:'[Ar] 3d¹⁰ 4s² 4p¹',         en:1.81, st:'s' },
  { z:32,  s:'Ge', n:'Germanium',      m:72.63,   c:'Mt', p:4, g:14, e:'[Ar] 3d¹⁰ 4s² 4p²',         en:2.01, st:'s' },
  { z:33,  s:'As', n:'Arsenic',        m:74.922,  c:'Mt', p:4, g:15, e:'[Ar] 3d¹⁰ 4s² 4p³',         en:2.18, st:'s' },
  { z:34,  s:'Se', n:'Selenium',       m:78.971,  c:'Nm', p:4, g:16, e:'[Ar] 3d¹⁰ 4s² 4p⁴',         en:2.55, st:'s' },
  { z:35,  s:'Br', n:'Bromine',        m:79.904,  c:'Ha', p:4, g:17, e:'[Ar] 3d¹⁰ 4s² 4p⁵',         en:2.96, st:'l' },
  { z:36,  s:'Kr', n:'Krypton',        m:83.798,  c:'Ng', p:4, g:18, e:'[Ar] 3d¹⁰ 4s² 4p⁶',         en:3.00, st:'g' },
  // Period 5
  { z:37,  s:'Rb', n:'Rubidium',       m:85.468,  c:'Al', p:5, g:1,  e:'[Kr] 5s¹',                  en:0.82, st:'s' },
  { z:38,  s:'Sr', n:'Strontium',      m:87.62,   c:'Ae', p:5, g:2,  e:'[Kr] 5s²',                  en:0.95, st:'s' },
  { z:39,  s:'Y',  n:'Yttrium',        m:88.906,  c:'Tm', p:5, g:3,  e:'[Kr] 4d¹ 5s²',              en:1.22, st:'s' },
  { z:40,  s:'Zr', n:'Zirconium',      m:91.224,  c:'Tm', p:5, g:4,  e:'[Kr] 4d² 5s²',              en:1.33, st:'s' },
  { z:41,  s:'Nb', n:'Niobium',        m:92.906,  c:'Tm', p:5, g:5,  e:'[Kr] 4d⁴ 5s¹',              en:1.60, st:'s' },
  { z:42,  s:'Mo', n:'Molybdenum',     m:95.96,   c:'Tm', p:5, g:6,  e:'[Kr] 4d⁵ 5s¹',              en:2.16, st:'s' },
  { z:43,  s:'Tc', n:'Technetium',     m:98,      c:'Tm', p:5, g:7,  e:'[Kr] 4d⁵ 5s²',              en:1.90, st:'s' },
  { z:44,  s:'Ru', n:'Ruthenium',      m:101.07,  c:'Tm', p:5, g:8,  e:'[Kr] 4d⁷ 5s¹',              en:2.20, st:'s' },
  { z:45,  s:'Rh', n:'Rhodium',        m:102.906, c:'Tm', p:5, g:9,  e:'[Kr] 4d⁸ 5s¹',              en:2.28, st:'s' },
  { z:46,  s:'Pd', n:'Palladium',      m:106.42,  c:'Tm', p:5, g:10, e:'[Kr] 4d¹⁰',                 en:2.20, st:'s' },
  { z:47,  s:'Ag', n:'Silver',         m:107.868, c:'Tm', p:5, g:11, e:'[Kr] 4d¹⁰ 5s¹',             en:1.93, st:'s' },
  { z:48,  s:'Cd', n:'Cadmium',        m:112.411, c:'Tm', p:5, g:12, e:'[Kr] 4d¹⁰ 5s²',             en:1.69, st:'s' },
  { z:49,  s:'In', n:'Indium',         m:114.818, c:'Pt', p:5, g:13, e:'[Kr] 4d¹⁰ 5s² 5p¹',         en:1.78, st:'s' },
  { z:50,  s:'Sn', n:'Tin',            m:118.71,  c:'Pt', p:5, g:14, e:'[Kr] 4d¹⁰ 5s² 5p²',         en:1.96, st:'s' },
  { z:51,  s:'Sb', n:'Antimony',       m:121.76,  c:'Mt', p:5, g:15, e:'[Kr] 4d¹⁰ 5s² 5p³',         en:2.05, st:'s' },
  { z:52,  s:'Te', n:'Tellurium',      m:127.6,   c:'Mt', p:5, g:16, e:'[Kr] 4d¹⁰ 5s² 5p⁴',         en:2.10, st:'s' },
  { z:53,  s:'I',  n:'Iodine',         m:126.904, c:'Ha', p:5, g:17, e:'[Kr] 4d¹⁰ 5s² 5p⁵',         en:2.66, st:'s' },
  { z:54,  s:'Xe', n:'Xenon',          m:131.293, c:'Ng', p:5, g:18, e:'[Kr] 4d¹⁰ 5s² 5p⁶',         en:2.60, st:'g' },
  // Period 6 main
  { z:55,  s:'Cs', n:'Caesium',        m:132.905, c:'Al', p:6, g:1,  e:'[Xe] 6s¹',                  en:0.79, st:'s' },
  { z:56,  s:'Ba', n:'Barium',         m:137.327, c:'Ae', p:6, g:2,  e:'[Xe] 6s²',                  en:0.89, st:'s' },
  { z:72,  s:'Hf', n:'Hafnium',        m:178.49,  c:'Tm', p:6, g:4,  e:'[Xe] 4f¹⁴ 5d² 6s²',         en:1.30, st:'s' },
  { z:73,  s:'Ta', n:'Tantalum',       m:180.948, c:'Tm', p:6, g:5,  e:'[Xe] 4f¹⁴ 5d³ 6s²',         en:1.50, st:'s' },
  { z:74,  s:'W',  n:'Tungsten',       m:183.84,  c:'Tm', p:6, g:6,  e:'[Xe] 4f¹⁴ 5d⁴ 6s²',         en:2.36, st:'s' },
  { z:75,  s:'Re', n:'Rhenium',        m:186.207, c:'Tm', p:6, g:7,  e:'[Xe] 4f¹⁴ 5d⁵ 6s²',         en:1.90, st:'s' },
  { z:76,  s:'Os', n:'Osmium',         m:190.23,  c:'Tm', p:6, g:8,  e:'[Xe] 4f¹⁴ 5d⁶ 6s²',         en:2.20, st:'s' },
  { z:77,  s:'Ir', n:'Iridium',        m:192.217, c:'Tm', p:6, g:9,  e:'[Xe] 4f¹⁴ 5d⁷ 6s²',         en:2.20, st:'s' },
  { z:78,  s:'Pt', n:'Platinum',       m:195.084, c:'Tm', p:6, g:10, e:'[Xe] 4f¹⁴ 5d⁹ 6s¹',         en:2.28, st:'s' },
  { z:79,  s:'Au', n:'Gold',           m:196.967, c:'Tm', p:6, g:11, e:'[Xe] 4f¹⁴ 5d¹⁰ 6s¹',        en:2.54, st:'s' },
  { z:80,  s:'Hg', n:'Mercury',        m:200.592, c:'Tm', p:6, g:12, e:'[Xe] 4f¹⁴ 5d¹⁰ 6s²',        en:2.00, st:'l' },
  { z:81,  s:'Tl', n:'Thallium',       m:204.38,  c:'Pt', p:6, g:13, e:'[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹',   en:1.62, st:'s' },
  { z:82,  s:'Pb', n:'Lead',           m:207.2,   c:'Pt', p:6, g:14, e:'[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²',   en:2.33, st:'s' },
  { z:83,  s:'Bi', n:'Bismuth',        m:208.980, c:'Pt', p:6, g:15, e:'[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³',   en:2.02, st:'s' },
  { z:84,  s:'Po', n:'Polonium',       m:209,     c:'Mt', p:6, g:16, e:'[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴',   en:2.00, st:'s' },
  { z:85,  s:'At', n:'Astatine',       m:210,     c:'Ha', p:6, g:17, e:'[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵',   en:2.20, st:'s' },
  { z:86,  s:'Rn', n:'Radon',          m:222,     c:'Ng', p:6, g:18, e:'[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶',   en:null, st:'g' },
  // Period 7 main
  { z:87,  s:'Fr', n:'Francium',       m:223,     c:'Al', p:7, g:1,  e:'[Rn] 7s¹',                  en:0.70, st:'s' },
  { z:88,  s:'Ra', n:'Radium',         m:226,     c:'Ae', p:7, g:2,  e:'[Rn] 7s²',                  en:0.90, st:'s' },
  { z:104, s:'Rf', n:'Rutherfordium',  m:267,     c:'Tm', p:7, g:4,  e:'[Rn] 5f¹⁴ 6d² 7s²',         en:null, st:'?' },
  { z:105, s:'Db', n:'Dubnium',        m:268,     c:'Tm', p:7, g:5,  e:'[Rn] 5f¹⁴ 6d³ 7s²',         en:null, st:'?' },
  { z:106, s:'Sg', n:'Seaborgium',     m:271,     c:'Tm', p:7, g:6,  e:'[Rn] 5f¹⁴ 6d⁴ 7s²',         en:null, st:'?' },
  { z:107, s:'Bh', n:'Bohrium',        m:272,     c:'Tm', p:7, g:7,  e:'[Rn] 5f¹⁴ 6d⁵ 7s²',         en:null, st:'?' },
  { z:108, s:'Hs', n:'Hassium',        m:270,     c:'Tm', p:7, g:8,  e:'[Rn] 5f¹⁴ 6d⁶ 7s²',         en:null, st:'?' },
  { z:109, s:'Mt', n:'Meitnerium',     m:278,     c:'Tm', p:7, g:9,  e:'[Rn] 5f¹⁴ 6d⁷ 7s²',         en:null, st:'?' },
  { z:110, s:'Ds', n:'Darmstadtium',   m:281,     c:'Tm', p:7, g:10, e:'[Rn] 5f¹⁴ 6d⁸ 7s²',         en:null, st:'?' },
  { z:111, s:'Rg', n:'Roentgenium',    m:282,     c:'Tm', p:7, g:11, e:'[Rn] 5f¹⁴ 6d⁹ 7s²',         en:null, st:'?' },
  { z:112, s:'Cn', n:'Copernicium',    m:285,     c:'Tm', p:7, g:12, e:'[Rn] 5f¹⁴ 6d¹⁰ 7s²',        en:null, st:'?' },
  { z:113, s:'Nh', n:'Nihonium',       m:286,     c:'Pt', p:7, g:13, e:'[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹',   en:null, st:'?' },
  { z:114, s:'Fl', n:'Flerovium',      m:289,     c:'Pt', p:7, g:14, e:'[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²',   en:null, st:'?' },
  { z:115, s:'Mc', n:'Moscovium',      m:290,     c:'Pt', p:7, g:15, e:'[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³',   en:null, st:'?' },
  { z:116, s:'Lv', n:'Livermorium',    m:293,     c:'Pt', p:7, g:16, e:'[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴',   en:null, st:'?' },
  { z:117, s:'Ts', n:'Tennessine',     m:294,     c:'Ha', p:7, g:17, e:'[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵',   en:null, st:'?' },
  { z:118, s:'Og', n:'Oganesson',      m:294,     c:'Ng', p:7, g:18, e:'[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶',   en:null, st:'?' },
  // Lanthanides (display row 1 of f-block, col offset +3)
  { z:57,  s:'La', n:'Lanthanum',      m:138.905, c:'La', p:6, g:null, dr:1, dc:1,  e:'[Xe] 5d¹ 6s²',         en:1.10, st:'s' },
  { z:58,  s:'Ce', n:'Cerium',         m:140.116, c:'La', p:6, g:null, dr:1, dc:2,  e:'[Xe] 4f¹ 5d¹ 6s²',     en:1.12, st:'s' },
  { z:59,  s:'Pr', n:'Praseodymium',   m:140.908, c:'La', p:6, g:null, dr:1, dc:3,  e:'[Xe] 4f³ 6s²',         en:1.13, st:'s' },
  { z:60,  s:'Nd', n:'Neodymium',      m:144.242, c:'La', p:6, g:null, dr:1, dc:4,  e:'[Xe] 4f⁴ 6s²',         en:1.14, st:'s' },
  { z:61,  s:'Pm', n:'Promethium',     m:145,     c:'La', p:6, g:null, dr:1, dc:5,  e:'[Xe] 4f⁵ 6s²',         en:1.13, st:'s' },
  { z:62,  s:'Sm', n:'Samarium',       m:150.36,  c:'La', p:6, g:null, dr:1, dc:6,  e:'[Xe] 4f⁶ 6s²',         en:1.17, st:'s' },
  { z:63,  s:'Eu', n:'Europium',       m:151.964, c:'La', p:6, g:null, dr:1, dc:7,  e:'[Xe] 4f⁷ 6s²',         en:1.20, st:'s' },
  { z:64,  s:'Gd', n:'Gadolinium',     m:157.25,  c:'La', p:6, g:null, dr:1, dc:8,  e:'[Xe] 4f⁷ 5d¹ 6s²',     en:1.20, st:'s' },
  { z:65,  s:'Tb', n:'Terbium',        m:158.925, c:'La', p:6, g:null, dr:1, dc:9,  e:'[Xe] 4f⁹ 6s²',         en:1.10, st:'s' },
  { z:66,  s:'Dy', n:'Dysprosium',     m:162.500, c:'La', p:6, g:null, dr:1, dc:10, e:'[Xe] 4f¹⁰ 6s²',        en:1.22, st:'s' },
  { z:67,  s:'Ho', n:'Holmium',        m:164.930, c:'La', p:6, g:null, dr:1, dc:11, e:'[Xe] 4f¹¹ 6s²',        en:1.23, st:'s' },
  { z:68,  s:'Er', n:'Erbium',         m:167.259, c:'La', p:6, g:null, dr:1, dc:12, e:'[Xe] 4f¹² 6s²',        en:1.24, st:'s' },
  { z:69,  s:'Tm', n:'Thulium',        m:168.934, c:'La', p:6, g:null, dr:1, dc:13, e:'[Xe] 4f¹³ 6s²',        en:1.25, st:'s' },
  { z:70,  s:'Yb', n:'Ytterbium',      m:173.054, c:'La', p:6, g:null, dr:1, dc:14, e:'[Xe] 4f¹⁴ 6s²',        en:1.10, st:'s' },
  { z:71,  s:'Lu', n:'Lutetium',       m:174.967, c:'La', p:6, g:null, dr:1, dc:15, e:'[Xe] 4f¹⁴ 5d¹ 6s²',    en:1.27, st:'s' },
  // Actinides (display row 2 of f-block)
  { z:89,  s:'Ac', n:'Actinium',       m:227,     c:'Ac', p:7, g:null, dr:2, dc:1,  e:'[Rn] 6d¹ 7s²',         en:1.10, st:'s' },
  { z:90,  s:'Th', n:'Thorium',        m:232.038, c:'Ac', p:7, g:null, dr:2, dc:2,  e:'[Rn] 6d² 7s²',         en:1.30, st:'s' },
  { z:91,  s:'Pa', n:'Protactinium',   m:231.036, c:'Ac', p:7, g:null, dr:2, dc:3,  e:'[Rn] 5f² 6d¹ 7s²',     en:1.50, st:'s' },
  { z:92,  s:'U',  n:'Uranium',        m:238.029, c:'Ac', p:7, g:null, dr:2, dc:4,  e:'[Rn] 5f³ 6d¹ 7s²',     en:1.38, st:'s' },
  { z:93,  s:'Np', n:'Neptunium',      m:237,     c:'Ac', p:7, g:null, dr:2, dc:5,  e:'[Rn] 5f⁴ 6d¹ 7s²',     en:1.36, st:'s' },
  { z:94,  s:'Pu', n:'Plutonium',      m:244,     c:'Ac', p:7, g:null, dr:2, dc:6,  e:'[Rn] 5f⁶ 7s²',         en:1.28, st:'s' },
  { z:95,  s:'Am', n:'Americium',      m:243,     c:'Ac', p:7, g:null, dr:2, dc:7,  e:'[Rn] 5f⁷ 7s²',         en:1.30, st:'s' },
  { z:96,  s:'Cm', n:'Curium',         m:247,     c:'Ac', p:7, g:null, dr:2, dc:8,  e:'[Rn] 5f⁷ 6d¹ 7s²',     en:1.30, st:'s' },
  { z:97,  s:'Bk', n:'Berkelium',      m:247,     c:'Ac', p:7, g:null, dr:2, dc:9,  e:'[Rn] 5f⁹ 7s²',         en:1.30, st:'s' },
  { z:98,  s:'Cf', n:'Californium',    m:251,     c:'Ac', p:7, g:null, dr:2, dc:10, e:'[Rn] 5f¹⁰ 7s²',        en:1.30, st:'s' },
  { z:99,  s:'Es', n:'Einsteinium',    m:252,     c:'Ac', p:7, g:null, dr:2, dc:11, e:'[Rn] 5f¹¹ 7s²',        en:1.30, st:'s' },
  { z:100, s:'Fm', n:'Fermium',        m:257,     c:'Ac', p:7, g:null, dr:2, dc:12, e:'[Rn] 5f¹² 7s²',        en:1.30, st:'s' },
  { z:101, s:'Md', n:'Mendelevium',    m:258,     c:'Ac', p:7, g:null, dr:2, dc:13, e:'[Rn] 5f¹³ 7s²',        en:1.30, st:'s' },
  { z:102, s:'No', n:'Nobelium',       m:259,     c:'Ac', p:7, g:null, dr:2, dc:14, e:'[Rn] 5f¹⁴ 7s²',        en:1.30, st:'s' },
  { z:103, s:'Lr', n:'Lawrencium',     m:266,     c:'Ac', p:7, g:null, dr:2, dc:15, e:'[Rn] 5f¹⁴ 7s² 7p¹',   en:1.30, st:'s' },
]

// ─── Category styling ─────────────────────────────────────────────────────────

const CAT = {
  H:  { bg: '#fef3c7', b: '#fbbf24', t: '#92400e', name: 'Hydrogen' },
  Al: { bg: '#fee2e2', b: '#f87171', t: '#991b1b', name: 'Alkali Metal' },
  Ae: { bg: '#ffedd5', b: '#fb923c', t: '#9a3412', name: 'Alkaline Earth' },
  Tm: { bg: '#fefce8', b: '#facc15', t: '#713f12', name: 'Transition Metal' },
  Pt: { bg: '#dcfce7', b: '#4ade80', t: '#166534', name: 'Post-transition' },
  Mt: { bg: '#d1fae5', b: '#34d399', t: '#065f46', name: 'Metalloid' },
  Nm: { bg: '#dbeafe', b: '#60a5fa', t: '#1e3a8a', name: 'Nonmetal' },
  Ha: { bg: '#ede9fe', b: '#a78bfa', t: '#5b21b6', name: 'Halogen' },
  Ng: { bg: '#f1f5f9', b: '#94a3b8', t: '#334155', name: 'Noble Gas' },
  La: { bg: '#ecfeff', b: '#22d3ee', t: '#155e75', name: 'Lanthanide' },
  Ac: { bg: '#fdf4ff', b: '#d946ef', t: '#701a75', name: 'Actinide' },
}

const STATE = { s: 'Solid', l: 'Liquid', g: 'Gas', '?': 'Synthetic' }
const STATE_DOT = { s: 'bg-gray-400', l: 'bg-blue-400', g: 'bg-sky-300', '?': 'bg-purple-300' }

// ─── Container size hook ──────────────────────────────────────────────────────

function useSize(ref) {
  const [size, setSize] = useState({ w: 700, h: 500 })
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) =>
      setSize({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return size
}

// ─── Element cell ─────────────────────────────────────────────────────────────

function Cell({ el, selected, dimmed, onSelect, cs }) {
  const c = CAT[el.c]
  const showMass = cs >= 30
  return (
    <button
      onClick={() => onSelect(el)}
      title={el.n}
      style={{
        width: cs, height: cs,
        background: c.bg,
        borderColor: selected ? '#3b82f6' : c.b,
        borderWidth: selected ? 2 : 1,
        color: c.t,
        opacity: dimmed ? 0.25 : 1,
        flexShrink: 0,
      }}
      className="rounded flex flex-col items-center justify-center overflow-hidden transition-opacity cursor-pointer hover:brightness-95 active:brightness-90"
    >
      <span style={{ fontSize: Math.max(5, cs * 0.22), lineHeight: 1 }} className="font-mono opacity-60 leading-none">{el.z}</span>
      <span style={{ fontSize: Math.max(7, cs * 0.36), lineHeight: 1 }} className="font-bold leading-none">{el.s}</span>
      {showMass && (
        <span style={{ fontSize: Math.max(4, cs * 0.18), lineHeight: 1 }} className="opacity-55 leading-none font-mono">
          {el.m < 100 ? el.m.toFixed(2) : el.m.toFixed(0)}
        </span>
      )}
    </button>
  )
}

function PlaceholderCell({ label, catKey, cs, onClick }) {
  const c = CAT[catKey]
  return (
    <button
      onClick={onClick}
      style={{ width: cs, height: cs, background: c.bg, borderColor: c.b, color: c.t, flexShrink: 0 }}
      className="rounded border border-dashed flex items-center justify-center font-mono cursor-pointer hover:brightness-95 transition-opacity"
      title={`${catKey === 'La' ? 'Lanthanides' : 'Actinides'} (click to scroll)`}
    >
      <span style={{ fontSize: Math.max(4, cs * 0.17) }}>*</span>
    </button>
  )
}

function EmptyCell({ cs }) {
  return <div style={{ width: cs, height: cs, flexShrink: 0 }} />
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function Detail({ el, onClose }) {
  const c = CAT[el.c]
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex gap-4 items-start">
      {/* Big symbol */}
      <div
        className="rounded-lg flex flex-col items-center justify-center shrink-0"
        style={{ background: c.bg, borderColor: c.b, border: `2px solid ${c.b}`, width: 72, height: 72 }}
      >
        <span style={{ fontSize: 9, color: c.t, opacity: 0.7 }} className="font-mono">{el.z}</span>
        <span style={{ fontSize: 26, color: c.t }} className="font-bold leading-none">{el.s}</span>
        <span style={{ fontSize: 8, color: c.t, opacity: 0.7 }} className="font-mono leading-none">
          {el.m < 100 ? el.m.toFixed(3) : el.m.toFixed(1)}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-800 text-sm leading-tight">{el.n}</h3>
            <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: c.bg, color: c.t, border: `1px solid ${c.b}` }}>
              {c.name}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-lg leading-none shrink-0 transition-colors">×</button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5">
          <Row label="Period" val={el.p} />
          <Row label="Group" val={el.g ?? '—'} />
          <Row label="State" val={
            <span className="flex items-center gap-1">
              <span className={`inline-block w-2 h-2 rounded-full ${STATE_DOT[el.st]}`} />
              {STATE[el.st]}
            </span>
          } />
          <Row label="Electronegativity" val={el.en != null ? el.en.toFixed(2) : '—'} />
          <div className="col-span-2">
            <Row label="Electron config" val={el.e} mono />
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, val, mono }) {
  return (
    <div className="flex items-baseline gap-1 py-0.5">
      <span className="text-xs text-gray-400 shrink-0 w-24">{label}</span>
      <span className={`text-xs text-gray-700 truncate ${mono ? 'font-mono' : ''}`}>{val}</span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PeriodicTable() {
  const rootRef = useRef(null)
  const fblockRef = useRef(null)
  const { w: cw } = useSize(rootRef)

  const [selected, setSelected] = useState(null)
  const [filterCat, setFilterCat] = useState(null)

  // Cell size: fit 18 columns with 2px gaps
  const GAP = 2
  const cs = Math.max(20, Math.min(52, Math.floor((cw - 8 - 17 * GAP) / 18)))

  // Build main 7×18 grid
  const mainGrid = Array.from({ length: 7 }, () => Array(18).fill(null))
  const fblockEls = []
  for (const el of ELEMENTS) {
    if (el.g !== null) {
      mainGrid[el.p - 1][el.g - 1] = el
    } else {
      fblockEls.push(el)
    }
  }

  // Build f-block 2×15 grid
  const fbGrid = Array.from({ length: 2 }, () => Array(15).fill(null))
  for (const el of fblockEls) {
    fbGrid[el.dr - 1][el.dc - 1] = el
  }

  // f-block left offset: aligns column 3 of f-block with main table column 3
  const fbOffset = 2 * (cs + GAP)

  const handleSelect = (el) => {
    setSelected(prev => prev?.z === el.z ? null : el)
    // Scroll to f-block if clicking a lanthanide/actinide placeholder
  }

  const scrollToFblock = () => {
    fblockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  return (
    <div ref={rootRef} className="h-full flex flex-col gap-2 p-2 overflow-y-auto bg-gray-50">

      {/* Category legend */}
      <div className="flex flex-wrap gap-1 shrink-0">
        {Object.entries(CAT).map(([code, style]) => (
          <button
            key={code}
            onClick={() => setFilterCat(prev => prev === code ? null : code)}
            style={{
              background: style.bg,
              borderColor: style.b,
              color: style.t,
              borderWidth: filterCat === code ? 2 : 1,
              fontSize: 10,
            }}
            className="px-1.5 py-0.5 rounded border font-medium leading-tight transition-all"
          >
            {style.name}
          </button>
        ))}
        {filterCat && (
          <button onClick={() => setFilterCat(null)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-1">
            clear
          </button>
        )}
      </div>

      {/* Main table */}
      <div className="flex flex-col shrink-0" style={{ gap: GAP }}>
        {mainGrid.map((row, ri) => (
          <div key={ri} className="flex" style={{ gap: GAP }}>
            {row.map((el, ci) => {
              if (!el) return <EmptyCell key={ci} cs={cs} />
              if (el === 'La*') return <PlaceholderCell key={ci} label="*" catKey="La" cs={cs} onClick={scrollToFblock} />
              if (el === 'Ac*') return <PlaceholderCell key={ci} label="*" catKey="Ac" cs={cs} onClick={scrollToFblock} />
              // La/Ac placeholder positions
              if (ri === 5 && ci === 2) return <PlaceholderCell key={ci} label="*" catKey="La" cs={cs} onClick={scrollToFblock} />
              if (ri === 6 && ci === 2) return <PlaceholderCell key={ci} label="*" catKey="Ac" cs={cs} onClick={scrollToFblock} />
              return (
                <Cell
                  key={ci}
                  el={el}
                  selected={selected?.z === el.z}
                  dimmed={!!filterCat && el.c !== filterCat}
                  onSelect={handleSelect}
                  cs={cs}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* F-block separator */}
      <div ref={fblockRef} className="flex items-center gap-2 shrink-0">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">f-block</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* F-block table */}
      <div className="flex flex-col shrink-0" style={{ gap: GAP, marginLeft: fbOffset }}>
        {fbGrid.map((row, ri) => (
          <div key={ri} className="flex" style={{ gap: GAP }}>
            {row.map((el, ci) =>
              el ? (
                <Cell
                  key={ci}
                  el={el}
                  selected={selected?.z === el.z}
                  dimmed={!!filterCat && el.c !== filterCat}
                  onSelect={handleSelect}
                  cs={cs}
                />
              ) : (
                <EmptyCell key={ci} cs={cs} />
              )
            )}
          </div>
        ))}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="shrink-0">
          <Detail el={selected} onClose={() => setSelected(null)} />
        </div>
      )}
    </div>
  )
}
