---
title: Matrix Calculator
description: Perform matrix operations including RREF, eigenvalues, inverse, and solving Ax=b.
toolId: matrix-calc
icon: ⊞
tags: [math, linear-algebra]
---

# Matrix Calculator

The Matrix Calculator supports two matrices (A and B) and a full suite of linear algebra operations.

## Entering a Matrix

Each matrix has a **rows** and **cols** input in the top-left of its panel. Type the dimensions you want (up to 8×8).

The grid of input cells appears to the right. You can:

- Type values directly into cells
- Press **Tab** or **Enter** to move to the next cell
- Click **rand** to fill with random integers
- Click **I** to fill as an identity matrix
- Click **clear** to reset to zeros

## Operations

Select an operation from the dropdown and click **Calculate**:

| Operation | Description |
|---|---|
| A + B | Matrix addition |
| A − B | Matrix subtraction |
| A × B | Matrix multiplication |
| Aᵀ | Transpose of A |
| A⁻¹ | Inverse of A (square matrices only) |
| RREF | Reduced row echelon form with step-by-step row operations |
| det(A) | Determinant (uses cofactor expansion) |
| tr(A) | Trace (sum of diagonal) |
| rank(A) | Rank via RREF |
| A² | A multiplied by itself |
| eigenvalues | Eigenvalues (analytical for 2×2, Newton's method for 3×3) |
| Solve Ax=b | Uses the first column of B as the vector **b** |

## RREF Step-by-Step

The RREF operation shows a collapsible **Steps** panel beneath the result, listing every row operation performed:

- `R2 − (3)·R1` — subtract a multiple of one row from another
- `R1 × (1/2)` — scale a row

This is useful for checking work or understanding Gaussian elimination.

## Eigenvalues

For **2×2** matrices, eigenvalues are computed analytically from the characteristic polynomial.

For **3×3** matrices, Newton's method finds roots of det(A − λI) = 0 numerically. Results are shown as real numbers (complex eigenvalues display as `complex`).

## Tips

- For **Solve Ax=b**: put your coefficient matrix in A and your vector b in the first column of B.
- **Singular matrices** (det = 0) cannot be inverted — the calculator will show an error.
- Resize the card wider to see both matrices side by side.

## How It Works

Matrix operations are fundamental to linear algebra and have well-defined algorithms:

- **Matrix multiplication** (A × B): Element (i,j) of the result = dot product of row i of A with column j of B. Requires A's column count to equal B's row count. An m×n times n×p matrix produces an m×p result. Time complexity: O(m·n·p).
- **Determinant**: For a 2×2 matrix: `ad - bc`. For larger matrices, computed via **LU decomposition** — factoring M = L·U where L is lower triangular and U is upper triangular. The determinant is the product of U's diagonal.
- **Inverse**: Exists only if det(M) ≠ 0. Computed via **Gauss-Jordan elimination**: augment M with the identity matrix, then row-reduce until the left side becomes the identity — the right side is the inverse.
- **Eigenvalues**: Values λ where Mv = λv (the matrix only scales the vector, not rotates it). Found by solving det(M - λI) = 0. Used in PCA, Google's PageRank, quantum mechanics, and structural engineering.

## What Powers This

Matrix computations use **math.js** — an open-source JavaScript mathematics library with support for matrices, complex numbers, symbolic computation, and more. All calculations happen in your browser.
