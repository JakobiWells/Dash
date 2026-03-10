import { useState, useRef, useEffect, useCallback } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const CATEGORIES = [
  {
    id: 'algebra',
    name: 'Algebra',
    icon: '𝑥',
    formulas: [
      { name: 'Quadratic Formula', latex: 'x = \\dfrac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', desc: 'Roots of ax² + bx + c = 0' },
      { name: 'Binomial Theorem', latex: '(a+b)^n = \\sum_{k=0}^{n} \\binom{n}{k} a^{n-k} b^k', desc: 'Expansion of (a+b)ⁿ' },
      { name: 'Difference of Squares', latex: 'a^2 - b^2 = (a+b)(a-b)', desc: '' },
      { name: 'Perfect Square', latex: '(a \\pm b)^2 = a^2 \\pm 2ab + b^2', desc: '' },
      { name: 'Sum of Cubes', latex: 'a^3 + b^3 = (a+b)(a^2 - ab + b^2)', desc: '' },
      { name: 'Difference of Cubes', latex: 'a^3 - b^3 = (a-b)(a^2 + ab + b^2)', desc: '' },
      { name: 'Logarithm Product', latex: '\\log_b(xy) = \\log_b x + \\log_b y', desc: '' },
      { name: 'Logarithm Quotient', latex: '\\log_b\\!\\left(\\dfrac{x}{y}\\right) = \\log_b x - \\log_b y', desc: '' },
      { name: 'Logarithm Power', latex: '\\log_b(x^n) = n\\log_b x', desc: '' },
      { name: 'Change of Base', latex: '\\log_b x = \\dfrac{\\ln x}{\\ln b}', desc: '' },
      { name: 'Arithmetic Series', latex: 'S_n = \\dfrac{n}{2}(a_1 + a_n) = \\dfrac{n}{2}[2a_1 + (n-1)d]', desc: 'Sum of first n terms' },
      { name: 'Geometric Series', latex: 'S_n = a_1 \\cdot \\dfrac{1 - r^n}{1 - r}, \\quad r \\neq 1', desc: '' },
      { name: 'Infinite Geometric Series', latex: 'S = \\dfrac{a_1}{1 - r}, \\quad |r| < 1', desc: '' },
      { name: 'Permutations', latex: 'P(n,r) = \\dfrac{n!}{(n-r)!}', desc: 'Ordered arrangements' },
      { name: 'Combinations', latex: 'C(n,r) = \\binom{n}{r} = \\dfrac{n!}{r!\\,(n-r)!}', desc: 'Unordered selections' },
    ],
  },
  {
    id: 'geometry',
    name: 'Geometry',
    icon: '△',
    formulas: [
      { name: 'Circle Area', latex: 'A = \\pi r^2', desc: '' },
      { name: 'Circle Circumference', latex: 'C = 2\\pi r', desc: '' },
      { name: 'Sphere Volume', latex: 'V = \\dfrac{4}{3}\\pi r^3', desc: '' },
      { name: 'Sphere Surface Area', latex: 'A = 4\\pi r^2', desc: '' },
      { name: 'Cylinder Volume', latex: 'V = \\pi r^2 h', desc: '' },
      { name: 'Cone Volume', latex: 'V = \\dfrac{1}{3}\\pi r^2 h', desc: '' },
      { name: 'Triangle Area', latex: 'A = \\dfrac{1}{2}bh = \\dfrac{1}{2}ab\\sin C', desc: '' },
      { name: "Heron's Formula", latex: 'A = \\sqrt{s(s-a)(s-b)(s-c)},\\quad s=\\dfrac{a+b+c}{2}', desc: '' },
      { name: 'Pythagorean Theorem', latex: 'a^2 + b^2 = c^2', desc: '' },
      { name: 'Distance Formula', latex: 'd = \\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}', desc: '' },
      { name: 'Midpoint', latex: 'M = \\left(\\dfrac{x_1+x_2}{2},\\, \\dfrac{y_1+y_2}{2}\\right)', desc: '' },
      { name: 'Ellipse Area', latex: 'A = \\pi a b', desc: 'Semi-axes a, b' },
      { name: 'Arc Length', latex: 's = r\\theta', desc: 'θ in radians' },
      { name: 'Sector Area', latex: 'A = \\dfrac{1}{2}r^2\\theta', desc: '' },
      { name: 'Regular Polygon Area', latex: 'A = \\dfrac{1}{4}n s^2 \\cot\\!\\left(\\dfrac{\\pi}{n}\\right)', desc: 'n sides of length s' },
    ],
  },
  {
    id: 'trigonometry',
    name: 'Trigonometry',
    icon: 'sin',
    formulas: [
      { name: 'Pythagorean Identity', latex: '\\sin^2\\theta + \\cos^2\\theta = 1', desc: '' },
      { name: 'Pythagorean (tan)', latex: '\\tan^2\\theta + 1 = \\sec^2\\theta', desc: '' },
      { name: 'Pythagorean (cot)', latex: '\\cot^2\\theta + 1 = \\csc^2\\theta', desc: '' },
      { name: 'Angle Sum (sin)', latex: '\\sin(A \\pm B) = \\sin A\\cos B \\pm \\cos A\\sin B', desc: '' },
      { name: 'Angle Sum (cos)', latex: '\\cos(A \\pm B) = \\cos A\\cos B \\mp \\sin A\\sin B', desc: '' },
      { name: 'Angle Sum (tan)', latex: '\\tan(A \\pm B) = \\dfrac{\\tan A \\pm \\tan B}{1 \\mp \\tan A\\tan B}', desc: '' },
      { name: 'Double Angle (sin)', latex: '\\sin 2\\theta = 2\\sin\\theta\\cos\\theta', desc: '' },
      { name: 'Double Angle (cos)', latex: '\\cos 2\\theta = \\cos^2\\theta - \\sin^2\\theta = 2\\cos^2\\theta - 1', desc: '' },
      { name: 'Half Angle (sin)', latex: '\\sin\\dfrac{\\theta}{2} = \\pm\\sqrt{\\dfrac{1-\\cos\\theta}{2}}', desc: '' },
      { name: 'Half Angle (cos)', latex: '\\cos\\dfrac{\\theta}{2} = \\pm\\sqrt{\\dfrac{1+\\cos\\theta}{2}}', desc: '' },
      { name: 'Product to Sum', latex: '\\sin A\\cos B = \\tfrac{1}{2}[\\sin(A+B)+\\sin(A-B)]', desc: '' },
      { name: 'Law of Sines', latex: '\\dfrac{a}{\\sin A} = \\dfrac{b}{\\sin B} = \\dfrac{c}{\\sin C}', desc: '' },
      { name: 'Law of Cosines', latex: 'c^2 = a^2 + b^2 - 2ab\\cos C', desc: '' },
      { name: "Euler's Formula", latex: 'e^{i\\theta} = \\cos\\theta + i\\sin\\theta', desc: '' },
    ],
  },
  {
    id: 'calculus',
    name: 'Calculus',
    icon: '∫',
    formulas: [
      { name: 'Definition of Derivative', latex: "f'(x) = \\lim_{h \\to 0} \\dfrac{f(x+h) - f(x)}{h}", desc: '' },
      { name: 'Power Rule', latex: '\\dfrac{d}{dx}[x^n] = nx^{n-1}', desc: '' },
      { name: 'Product Rule', latex: "(fg)' = f'g + fg'", desc: '' },
      { name: 'Quotient Rule', latex: "\\left(\\dfrac{f}{g}\\right)' = \\dfrac{f'g - fg'}{g^2}", desc: '' },
      { name: 'Chain Rule', latex: "\\dfrac{d}{dx}[f(g(x))] = f'(g(x))\\,g'(x)", desc: '' },
      { name: 'Fundamental Theorem I', latex: '\\dfrac{d}{dx}\\int_a^x f(t)\\,dt = f(x)', desc: '' },
      { name: 'Fundamental Theorem II', latex: '\\int_a^b f(x)\\,dx = F(b) - F(a)', desc: '' },
      { name: 'Integration by Parts', latex: '\\int u\\,dv = uv - \\int v\\,du', desc: '' },
      { name: "L'Hôpital's Rule", latex: "\\lim_{x\\to a}\\dfrac{f(x)}{g(x)} = \\lim_{x\\to a}\\dfrac{f'(x)}{g'(x)}", desc: '0/0 or ∞/∞ forms' },
      { name: 'Taylor Series', latex: 'f(x) = \\sum_{n=0}^{\\infty}\\dfrac{f^{(n)}(a)}{n!}(x-a)^n', desc: '' },
      { name: 'Maclaurin: eˣ', latex: 'e^x = \\sum_{n=0}^{\\infty}\\dfrac{x^n}{n!}', desc: '' },
      { name: 'Maclaurin: sin x', latex: '\\sin x = \\sum_{n=0}^{\\infty}\\dfrac{(-1)^n x^{2n+1}}{(2n+1)!}', desc: '' },
      { name: 'Maclaurin: cos x', latex: '\\cos x = \\sum_{n=0}^{\\infty}\\dfrac{(-1)^n x^{2n}}{(2n)!}', desc: '' },
      { name: 'Gaussian Integral', latex: '\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}', desc: '' },
      { name: 'Arc Length', latex: 'L = \\int_a^b \\sqrt{1 + [f\'(x)]^2}\\,dx', desc: '' },
      { name: 'Divergence Theorem', latex: '\\oiint_S \\mathbf{F}\\cdot d\\mathbf{S} = \\iiint_V (\\nabla\\cdot\\mathbf{F})\\,dV', desc: '' },
      { name: "Stokes' Theorem", latex: '\\oint_C \\mathbf{F}\\cdot d\\mathbf{r} = \\iint_S (\\nabla\\times\\mathbf{F})\\cdot d\\mathbf{S}', desc: '' },
      { name: 'Green\'s Theorem', latex: '\\oint_C (P\\,dx + Q\\,dy) = \\iint_D \\left(\\dfrac{\\partial Q}{\\partial x} - \\dfrac{\\partial P}{\\partial y}\\right)dA', desc: '' },
    ],
  },
  {
    id: 'linear-algebra',
    name: 'Linear Algebra',
    icon: '⊞',
    formulas: [
      { name: 'Matrix Multiplication', latex: '(AB)_{ij} = \\sum_k A_{ik}B_{kj}', desc: '' },
      { name: '2×2 Determinant', latex: '\\det\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix} = ad - bc', desc: '' },
      { name: '2×2 Inverse', latex: 'A^{-1} = \\dfrac{1}{ad-bc}\\begin{pmatrix}d&-b\\\\-c&a\\end{pmatrix}', desc: '' },
      { name: 'Eigenvalue Equation', latex: 'A\\mathbf{v} = \\lambda\\mathbf{v}', desc: '' },
      { name: 'Characteristic Polynomial', latex: '\\det(A - \\lambda I) = 0', desc: '' },
      { name: 'Transpose Properties', latex: '(AB)^T = B^T A^T,\\quad (A^T)^T = A', desc: '' },
      { name: 'Trace', latex: '\\text{tr}(A) = \\sum_i A_{ii} = \\sum_i \\lambda_i', desc: '' },
      { name: 'Dot Product', latex: '\\mathbf{a}\\cdot\\mathbf{b} = |\\mathbf{a}||\\mathbf{b}|\\cos\\theta = \\sum_i a_i b_i', desc: '' },
      { name: 'Cross Product Magnitude', latex: '|\\mathbf{a}\\times\\mathbf{b}| = |\\mathbf{a}||\\mathbf{b}|\\sin\\theta', desc: '' },
      { name: 'Cross Product', latex: '\\mathbf{a}\\times\\mathbf{b} = \\begin{vmatrix}\\mathbf{i}&\\mathbf{j}&\\mathbf{k}\\\\a_1&a_2&a_3\\\\b_1&b_2&b_3\\end{vmatrix}', desc: '' },
      { name: 'Gram-Schmidt', latex: '\\mathbf{u}_k = \\mathbf{v}_k - \\sum_{j<k}\\text{proj}_{\\mathbf{u}_j}\\mathbf{v}_k', desc: '' },
      { name: 'Rank-Nullity Theorem', latex: '\\text{rank}(A) + \\text{nullity}(A) = n', desc: 'n = number of columns' },
      { name: 'Singular Value Decomp.', latex: 'A = U\\Sigma V^T', desc: '' },
    ],
  },
  {
    id: 'diff-eq',
    name: 'Diff. Equations',
    icon: "y'",
    formulas: [
      { name: 'Separable ODE', latex: '\\dfrac{dy}{dx} = f(x)g(y) \\implies \\int\\dfrac{dy}{g(y)} = \\int f(x)\\,dx', desc: '' },
      { name: 'Linear 1st-Order ODE', latex: 'y\' + P(x)y = Q(x),\\quad \\mu = e^{\\int P\\,dx}', desc: '' },
      { name: 'Integrating Factor Solution', latex: 'y = \\dfrac{1}{\\mu}\\left(\\int \\mu Q\\,dx + C\\right)', desc: '' },
      { name: '2nd-Order Homogeneous', latex: 'ay\'\'+by\'+cy=0 \\implies y=e^{rt},\\; ar^2+br+c=0', desc: '' },
      { name: 'Euler\'s ODE', latex: 'x^2 y\'\' + xy\' + n^2 y = 0 \\implies y = x^m', desc: '' },
      { name: 'Laplace Transform', latex: '\\mathcal{L}\\{f(t)\\} = F(s) = \\int_0^\\infty e^{-st}f(t)\\,dt', desc: '' },
      { name: 'Laplace: Derivative', latex: '\\mathcal{L}\\{f\'\\} = sF(s) - f(0)', desc: '' },
      { name: 'Fourier Transform', latex: '\\hat{f}(\\xi) = \\int_{-\\infty}^{\\infty} f(x)\\,e^{-2\\pi i x\\xi}\\,dx', desc: '' },
      { name: 'Heat Equation', latex: '\\dfrac{\\partial u}{\\partial t} = \\alpha\\,\\nabla^2 u', desc: '' },
      { name: 'Wave Equation', latex: '\\dfrac{\\partial^2 u}{\\partial t^2} = c^2\\,\\nabla^2 u', desc: '' },
      { name: "Laplace's Equation", latex: '\\nabla^2 u = 0', desc: '' },
    ],
  },
  {
    id: 'mechanics',
    name: 'Mechanics',
    icon: 'F',
    formulas: [
      { name: "Newton's 2nd Law", latex: '\\mathbf{F} = m\\mathbf{a}', desc: '' },
      { name: 'Kinematic (velocity)', latex: 'v = v_0 + at', desc: '' },
      { name: 'Kinematic (position)', latex: 'x = x_0 + v_0 t + \\tfrac{1}{2}at^2', desc: '' },
      { name: 'Kinematic (v²)', latex: 'v^2 = v_0^2 + 2a(x - x_0)', desc: '' },
      { name: 'Momentum', latex: '\\mathbf{p} = m\\mathbf{v},\\quad \\mathbf{F} = \\dfrac{d\\mathbf{p}}{dt}', desc: '' },
      { name: 'Impulse', latex: 'J = \\int F\\,dt = \\Delta p', desc: '' },
      { name: 'Kinetic Energy', latex: 'K = \\dfrac{1}{2}mv^2', desc: '' },
      { name: 'Gravitational PE', latex: 'U_g = mgh', desc: '' },
      { name: 'Spring PE', latex: 'U_s = \\dfrac{1}{2}kx^2', desc: '' },
      { name: 'Work-Energy Theorem', latex: 'W_{\\text{net}} = \\Delta K', desc: '' },
      { name: 'Torque', latex: '\\boldsymbol{\\tau} = \\mathbf{r}\\times\\mathbf{F} = I\\boldsymbol{\\alpha}', desc: '' },
      { name: 'Angular Momentum', latex: '\\mathbf{L} = I\\boldsymbol{\\omega} = \\mathbf{r}\\times\\mathbf{p}', desc: '' },
      { name: 'Centripetal Acceleration', latex: 'a_c = \\dfrac{v^2}{r} = \\omega^2 r', desc: '' },
      { name: "Newton's Law of Gravitation", latex: 'F = G\\dfrac{m_1 m_2}{r^2}', desc: '' },
      { name: 'Escape Velocity', latex: 'v_e = \\sqrt{\\dfrac{2GM}{r}}', desc: '' },
      { name: 'Simple Pendulum Period', latex: 'T = 2\\pi\\sqrt{\\dfrac{L}{g}}', desc: '' },
      { name: 'Hooke\'s Law', latex: 'F = -kx', desc: '' },
    ],
  },
  {
    id: 'em',
    name: 'Electromagnetism',
    icon: '∇×',
    formulas: [
      { name: "Maxwell I — Gauss's Law", latex: '\\nabla\\cdot\\mathbf{E} = \\dfrac{\\rho}{\\varepsilon_0}', desc: 'Differential form' },
      { name: "Maxwell I — Gauss's Law (Integral)", latex: '\\oiint_S \\mathbf{E}\\cdot d\\mathbf{A} = \\dfrac{Q_{\\text{enc}}}{\\varepsilon_0}', desc: '' },
      { name: "Maxwell II — Gauss's Law (Magnetism)", latex: '\\nabla\\cdot\\mathbf{B} = 0', desc: 'No magnetic monopoles' },
      { name: "Maxwell III — Faraday's Law", latex: '\\nabla\\times\\mathbf{E} = -\\dfrac{\\partial\\mathbf{B}}{\\partial t}', desc: '' },
      { name: "Maxwell III (Integral)", latex: '\\oint_C \\mathbf{E}\\cdot d\\mathbf{l} = -\\dfrac{d\\Phi_B}{dt}', desc: '' },
      { name: "Maxwell IV — Ampère-Maxwell", latex: '\\nabla\\times\\mathbf{B} = \\mu_0\\mathbf{J} + \\mu_0\\varepsilon_0\\dfrac{\\partial\\mathbf{E}}{\\partial t}', desc: '' },
      { name: 'Lorentz Force', latex: '\\mathbf{F} = q(\\mathbf{E} + \\mathbf{v}\\times\\mathbf{B})', desc: '' },
      { name: 'Coulomb\'s Law', latex: 'F = k_e\\dfrac{q_1 q_2}{r^2} = \\dfrac{1}{4\\pi\\varepsilon_0}\\dfrac{q_1 q_2}{r^2}', desc: '' },
      { name: 'Electric Field (point charge)', latex: '\\mathbf{E} = \\dfrac{1}{4\\pi\\varepsilon_0}\\dfrac{q}{r^2}\\hat{r}', desc: '' },
      { name: 'Biot-Savart Law', latex: 'd\\mathbf{B} = \\dfrac{\\mu_0}{4\\pi}\\dfrac{I\\,d\\mathbf{l}\\times\\hat{r}}{r^2}', desc: '' },
      { name: 'Ohm\'s Law', latex: 'V = IR,\\quad \\mathbf{J} = \\sigma\\mathbf{E}', desc: '' },
      { name: 'Capacitor Energy', latex: 'U = \\dfrac{1}{2}CV^2 = \\dfrac{Q^2}{2C}', desc: '' },
      { name: 'Inductor Energy', latex: 'U = \\dfrac{1}{2}LI^2', desc: '' },
      { name: 'Speed of Light', latex: 'c = \\dfrac{1}{\\sqrt{\\mu_0\\varepsilon_0}}', desc: '' },
      { name: 'Electromagnetic Wave', latex: '\\nabla^2\\mathbf{E} = \\mu_0\\varepsilon_0\\dfrac{\\partial^2\\mathbf{E}}{\\partial t^2}', desc: '' },
      { name: 'Poynting Vector', latex: '\\mathbf{S} = \\dfrac{1}{\\mu_0}\\mathbf{E}\\times\\mathbf{B}', desc: '' },
    ],
  },
  {
    id: 'thermo',
    name: 'Thermodynamics',
    icon: 'ΔS',
    formulas: [
      { name: 'Ideal Gas Law', latex: 'PV = nRT = Nk_BT', desc: '' },
      { name: 'First Law of Thermodynamics', latex: '\\Delta U = Q - W', desc: '' },
      { name: 'Entropy Change', latex: 'dS = \\dfrac{\\delta Q_{\\text{rev}}}{T}', desc: '' },
      { name: 'Second Law', latex: '\\Delta S_{\\text{universe}} \\geq 0', desc: '' },
      { name: 'Boltzmann Entropy', latex: 'S = k_B \\ln\\Omega', desc: '' },
      { name: 'Carnot Efficiency', latex: '\\eta = 1 - \\dfrac{T_C}{T_H}', desc: '' },
      { name: 'Heat Capacity', latex: 'Q = mc\\Delta T,\\quad C = \\dfrac{\\delta Q}{\\delta T}', desc: '' },
      { name: 'Stefan-Boltzmann', latex: 'P = \\sigma A T^4', desc: '' },
      { name: 'Fourier Heat Conduction', latex: 'q = -k\\nabla T', desc: '' },
      { name: "Van der Waals Gas", latex: "\\left(P + \\dfrac{an^2}{V^2}\\right)(V - nb) = nRT", desc: '' },
      { name: 'Equipartition Theorem', latex: 'E = \\dfrac{f}{2}k_B T', desc: 'f degrees of freedom' },
      { name: 'Maxwell-Boltzmann Speed', latex: 'v_{\\text{rms}} = \\sqrt{\\dfrac{3k_B T}{m}}', desc: '' },
      { name: 'Helmholtz Free Energy', latex: 'F = U - TS', desc: '' },
      { name: 'Gibbs Free Energy', latex: 'G = H - TS = U + PV - TS', desc: '' },
    ],
  },
  {
    id: 'quantum',
    name: 'Quantum Mechanics',
    icon: 'ψ',
    formulas: [
      { name: 'Schrödinger Equation (time-dep.)', latex: 'i\\hbar\\dfrac{\\partial}{\\partial t}|\\psi\\rangle = \\hat{H}|\\psi\\rangle', desc: '' },
      { name: 'Schrödinger (time-indep.)', latex: '\\hat{H}\\psi = E\\psi', desc: '' },
      { name: 'De Broglie Wavelength', latex: '\\lambda = \\dfrac{h}{p} = \\dfrac{h}{mv}', desc: '' },
      { name: 'Heisenberg Uncertainty', latex: '\\Delta x\\,\\Delta p \\geq \\dfrac{\\hbar}{2}', desc: '' },
      { name: 'Energy-Time Uncertainty', latex: '\\Delta E\\,\\Delta t \\geq \\dfrac{\\hbar}{2}', desc: '' },
      { name: 'Planck–Einstein Relation', latex: 'E = hf = \\hbar\\omega', desc: '' },
      { name: 'Particle in a Box', latex: 'E_n = \\dfrac{n^2\\pi^2\\hbar^2}{2mL^2}', desc: '' },
      { name: 'Hydrogen Energy Levels', latex: 'E_n = -\\dfrac{13.6\\text{ eV}}{n^2}', desc: '' },
      { name: 'Born Rule', latex: 'P(x) = |\\psi(x)|^2', desc: '' },
      { name: 'Dirac Notation', latex: '\\langle\\phi|\\psi\\rangle = \\int \\phi^*(x)\\psi(x)\\,dx', desc: '' },
      { name: 'Commutator', latex: '[\\hat{x},\\hat{p}] = i\\hbar', desc: '' },
      { name: 'Pauli Matrices', latex: '\\sigma_x = \\begin{pmatrix}0&1\\\\1&0\\end{pmatrix},\\; \\sigma_y = \\begin{pmatrix}0&-i\\\\i&0\\end{pmatrix},\\; \\sigma_z = \\begin{pmatrix}1&0\\\\0&-1\\end{pmatrix}', desc: '' },
    ],
  },
  {
    id: 'relativity',
    name: 'Relativity',
    icon: 'γ',
    formulas: [
      { name: 'Lorentz Factor', latex: '\\gamma = \\dfrac{1}{\\sqrt{1 - v^2/c^2}}', desc: '' },
      { name: 'Time Dilation', latex: '\\Delta t = \\gamma\\,\\Delta t_0', desc: '' },
      { name: 'Length Contraction', latex: 'L = \\dfrac{L_0}{\\gamma}', desc: '' },
      { name: 'Relativistic Momentum', latex: '\\mathbf{p} = \\gamma m\\mathbf{v}', desc: '' },
      { name: 'Mass-Energy Equivalence', latex: 'E = mc^2', desc: '' },
      { name: 'Relativistic Energy', latex: 'E = \\gamma mc^2 = \\sqrt{(pc)^2 + (mc^2)^2}', desc: '' },
      { name: 'Spacetime Interval', latex: 's^2 = -c^2\\Delta t^2 + \\Delta x^2 + \\Delta y^2 + \\Delta z^2', desc: '' },
      { name: 'Minkowski Metric', latex: 'ds^2 = \\eta_{\\mu\\nu}\\,dx^\\mu dx^\\nu', desc: '' },
      { name: 'Einstein Field Equations', latex: 'G_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = \\dfrac{8\\pi G}{c^4}T_{\\mu\\nu}', desc: '' },
      { name: 'Relativistic Doppler', latex: 'f_{\\text{obs}} = f_0\\sqrt{\\dfrac{1+\\beta}{1-\\beta}},\\;\\beta=v/c', desc: '' },
      { name: 'Schwarzschild Radius', latex: 'r_s = \\dfrac{2GM}{c^2}', desc: '' },
    ],
  },
  {
    id: 'waves-optics',
    name: 'Waves & Optics',
    icon: '∿',
    formulas: [
      { name: 'Wave Equation', latex: 'y(x,t) = A\\sin(kx - \\omega t + \\phi)', desc: '' },
      { name: 'Wave Speed', latex: 'v = f\\lambda = \\dfrac{\\omega}{k}', desc: '' },
      { name: 'Snell\'s Law', latex: 'n_1\\sin\\theta_1 = n_2\\sin\\theta_2', desc: '' },
      { name: 'Lens Equation', latex: '\\dfrac{1}{f} = \\dfrac{1}{d_o} + \\dfrac{1}{d_i}', desc: '' },
      { name: 'Magnification', latex: 'm = -\\dfrac{d_i}{d_o}', desc: '' },
      { name: "Brewster's Angle", latex: '\\tan\\theta_B = \\dfrac{n_2}{n_1}', desc: '' },
      { name: 'Doppler Effect (sound)', latex: 'f_{\\text{obs}} = f_s\\dfrac{v \\pm v_o}{v \\mp v_s}', desc: '' },
      { name: 'Double Slit (constructive)', latex: 'd\\sin\\theta = m\\lambda,\\; m = 0,\\pm1,\\pm2,\\ldots', desc: '' },
      { name: 'Double Slit (destructive)', latex: 'd\\sin\\theta = \\left(m+\\tfrac{1}{2}\\right)\\lambda', desc: '' },
      { name: 'Single Slit Diffraction', latex: 'a\\sin\\theta = m\\lambda', desc: 'First minima m = ±1' },
      { name: 'Diffraction Grating', latex: 'd\\sin\\theta = m\\lambda', desc: '' },
      { name: 'Intensity (inverse square)', latex: 'I = \\dfrac{P}{4\\pi r^2}', desc: '' },
    ],
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    icon: 'mol',
    formulas: [
      { name: 'Ideal Gas Law', latex: 'PV = nRT,\\quad R = 8.314\\text{ J mol}^{-1}\\text{K}^{-1}', desc: '' },
      { name: 'Molarity', latex: 'M = \\dfrac{n_{\\text{solute}}}{V_{\\text{solution (L)}}}', desc: '' },
      { name: 'Beer-Lambert Law', latex: 'A = \\varepsilon l c = -\\log_{10}(T)', desc: '' },
      { name: 'Arrhenius Equation', latex: 'k = A\\,e^{-E_a/(RT)}', desc: '' },
      { name: 'Gibbs–Helmholtz', latex: '\\Delta G = \\Delta H - T\\Delta S', desc: '' },
      { name: 'Nernst Equation', latex: 'E = E^\\circ - \\dfrac{RT}{nF}\\ln Q', desc: '' },
      { name: 'Henderson–Hasselbalch', latex: '\\mathrm{pH} = \\mathrm{p}K_a + \\log\\dfrac{[\\mathrm{A}^-]}{[\\mathrm{HA}]}', desc: '' },
      { name: 'Rate Law', latex: '\\text{rate} = k[A]^m[B]^n', desc: '' },
      { name: 'Half-Life (1st order)', latex: 't_{1/2} = \\dfrac{\\ln 2}{k}', desc: '' },
      { name: 'Radioactive Decay', latex: 'N(t) = N_0 e^{-\\lambda t},\\quad \\lambda = \\dfrac{\\ln 2}{t_{1/2}}', desc: '' },
      { name: 'de Broglie (electron)', latex: '\\lambda = \\dfrac{h}{\\sqrt{2mE_k}}', desc: '' },
      { name: "Rydberg Formula", latex: '\\dfrac{1}{\\lambda} = R_H\\left(\\dfrac{1}{n_1^2} - \\dfrac{1}{n_2^2}\\right)', desc: '' },
    ],
  },
  {
    id: 'statistics',
    name: 'Statistics',
    icon: 'σ',
    formulas: [
      { name: 'Mean', latex: '\\bar{x} = \\dfrac{1}{n}\\sum_{i=1}^n x_i', desc: '' },
      { name: 'Variance', latex: 's^2 = \\dfrac{1}{n-1}\\sum_{i=1}^n (x_i - \\bar{x})^2', desc: 'Sample variance' },
      { name: 'Standard Deviation', latex: 's = \\sqrt{\\dfrac{\\sum(x_i-\\bar{x})^2}{n-1}}', desc: '' },
      { name: 'Z-Score', latex: 'z = \\dfrac{x - \\mu}{\\sigma}', desc: '' },
      { name: 'Normal Distribution PDF', latex: 'f(x) = \\dfrac{1}{\\sigma\\sqrt{2\\pi}}\\exp\\!\\left(-\\dfrac{(x-\\mu)^2}{2\\sigma^2}\\right)', desc: '' },
      { name: 'Bayes\' Theorem', latex: 'P(A|B) = \\dfrac{P(B|A)\\,P(A)}{P(B)}', desc: '' },
      { name: 'Covariance', latex: '\\text{Cov}(X,Y) = E[(X-\\mu_X)(Y-\\mu_Y)]', desc: '' },
      { name: 'Pearson Correlation', latex: 'r = \\dfrac{\\sum(x_i-\\bar{x})(y_i-\\bar{y})}{\\sqrt{\\sum(x_i-\\bar{x})^2\\sum(y_i-\\bar{y})^2}}', desc: '' },
      { name: 'Confidence Interval', latex: '\\bar{x} \\pm z^*\\dfrac{\\sigma}{\\sqrt{n}}', desc: '' },
      { name: 't-Statistic', latex: 't = \\dfrac{\\bar{x} - \\mu_0}{s/\\sqrt{n}}', desc: '' },
      { name: 'Chi-Squared Statistic', latex: '\\chi^2 = \\sum\\dfrac{(O_i - E_i)^2}{E_i}', desc: '' },
      { name: 'Binomial Probability', latex: 'P(X=k) = \\binom{n}{k}p^k(1-p)^{n-k}', desc: '' },
      { name: 'Poisson Distribution', latex: 'P(X=k) = \\dfrac{\\lambda^k e^{-\\lambda}}{k!}', desc: '' },
      { name: 'Central Limit Theorem', latex: '\\bar{X} \\xrightarrow{d} \\mathcal{N}\\!\\left(\\mu,\\dfrac{\\sigma^2}{n}\\right)\\text{ as }n\\to\\infty', desc: '' },
    ],
  },
  {
    id: 'number-theory',
    name: 'Number Theory',
    icon: 'ℤ',
    formulas: [
      { name: 'Euler\'s Identity', latex: 'e^{i\\pi} + 1 = 0', desc: '' },
      { name: 'Euler\'s Totient', latex: '\\phi(n) = n\\prod_{p|n}\\left(1-\\dfrac{1}{p}\\right)', desc: '' },
      { name: 'Fermat\'s Little Theorem', latex: 'a^{p-1} \\equiv 1 \\pmod{p}', desc: 'p prime, gcd(a,p)=1' },
      { name: 'Chinese Remainder Theorem', latex: 'x \\equiv a_i \\pmod{m_i},\\;i=1,\\ldots,k', desc: 'Unique solution mod lcm' },
      { name: 'Euler-Fermat Theorem', latex: 'a^{\\phi(n)} \\equiv 1 \\pmod{n}', desc: 'gcd(a,n)=1' },
      { name: 'Legendre Symbol', latex: '\\left(\\dfrac{a}{p}\\right) = a^{(p-1)/2} \\pmod{p}', desc: '' },
      { name: "Riemann Zeta Function", latex: '\\zeta(s) = \\sum_{n=1}^\\infty \\dfrac{1}{n^s} = \\prod_p \\dfrac{1}{1-p^{-s}}', desc: '' },
      { name: "Basel Problem", latex: '\\zeta(2) = \\sum_{n=1}^{\\infty}\\dfrac{1}{n^2} = \\dfrac{\\pi^2}{6}', desc: '' },
      { name: 'Stirling\'s Approximation', latex: 'n! \\approx \\sqrt{2\\pi n}\\left(\\dfrac{n}{e}\\right)^n', desc: '' },
    ],
  },
]

function renderLatex(latex) {
  try {
    return { html: katex.renderToString(latex, { displayMode: true, throwOnError: true, output: 'html' }), error: null }
  } catch (e) {
    return { html: null, error: e.message }
  }
}

function FormulaCard({ formula, onCopy, copied }) {
  const { html, error } = renderLatex(formula.latex)
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-col gap-1 group">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-semibold text-gray-700 leading-tight">{formula.name}</div>
        <button
          onClick={() => onCopy(formula.latex)}
          className="shrink-0 text-gray-300 hover:text-indigo-500 transition-colors"
          title="Copy LaTeX"
        >
          {copied ? (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-green-500">
              <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z"/>
              <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z"/>
            </svg>
          )}
        </button>
      </div>
      {formula.desc && <div className="text-xs text-gray-400 leading-tight">{formula.desc}</div>}
      <div className="overflow-x-auto py-1">
        {error ? (
          <div className="text-xs text-red-400 font-mono">{error}</div>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: html }} className="flex justify-center" />
        )}
      </div>
    </div>
  )
}

export default function FormulaBank() {
  const [activeCat, setActiveCat] = useState(CATEGORIES[0].id)
  const [search, setSearch] = useState('')
  const [copiedLatex, setCopiedLatex] = useState(null)
  const searchRef = useRef(null)

  const handleCopy = useCallback((latex) => {
    navigator.clipboard.writeText(latex).then(() => {
      setCopiedLatex(latex)
      setTimeout(() => setCopiedLatex(null), 1500)
    })
  }, [])

  const category = CATEGORIES.find(c => c.id === activeCat)
  const query = search.trim().toLowerCase()

  const visibleFormulas = query
    ? CATEGORIES.flatMap(cat => cat.formulas.filter(f =>
        f.name.toLowerCase().includes(query) ||
        f.desc.toLowerCase().includes(query) ||
        cat.name.toLowerCase().includes(query)
      ).map(f => ({ ...f, _cat: cat.name })))
    : category.formulas

  const showCatLabel = !!query

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-3 pt-3 pb-2 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-800">Formula Bank</span>
          <span className="text-xs text-gray-400 ml-auto">{CATEGORIES.reduce((a,c) => a + c.formulas.length, 0)} formulas</span>
        </div>
        <input
          ref={searchRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search formulas…"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
        />
      </div>

      {/* Category tabs */}
      {!query && (
        <div className="shrink-0 px-3 pb-2 flex gap-1 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                activeCat === cat.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Formula grid */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {visibleFormulas.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-gray-400">No formulas found</div>
        ) : (
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {visibleFormulas.map((f, i) => (
              <div key={i}>
                {showCatLabel && i === 0 || (showCatLabel && visibleFormulas[i-1]?._cat !== f._cat) ? (
                  <div className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1 mt-1">{f._cat}</div>
                ) : null}
                <FormulaCard formula={f} onCopy={handleCopy} copied={copiedLatex === f.latex} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
