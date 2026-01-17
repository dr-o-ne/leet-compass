---
title: 'Sliding Window Pattern'
layout: ../../layouts/main.astro
---

# Sliding Window Pattern

> **Move the window, not the computation**

Sliding Window is a technique for processing contiguous subarrays (or substrings) efficiently by maintaining a window over the data and moving it step by step instead of recomputing everything from scratch.

Instead of restarting work for every possible range, you reuse previous computations by:
- **adding elements** when the window expands
- **removing elements** when the window shrinks

This reduces many brute-force solutions from **O(n²)** to **O(n)**.

## Core Logic

A sliding window uses two pointers (`left` and `right`) to define a subarray (or substring) of the sequence. The `right` pointer expands the window by including new elements, while the `left` pointer shrinks the window by removing elements when the current window no longer satisfies the required condition. This allows efficient computation without reprocessing the entire window from scratch.

## Fixed Size Sliding Window

In a fixed-size window, the window length `k` remains constant. We first initialize the window by adding the first `k` elements, and then slide the window by adding one new element and removing one old element at each step.

### Two-Step Implementation

This traditional approach clearly separates the window into two distinct phases: first, filling the initial buffer of size `k`, and second, shifting that buffer across the rest of the collection.

```csharp
// 1) Initialize the first window
for (int i = 0; i < k; i++)
{
    Add(input[i]);
}
Process();

// 2) Slide the window
for (int i = k; i < input.Length; i++)
{
    Add(input[i]);
    Remove(input[i - k]);
    Process();
}
```

<div class="text-sm">

**Pros:**
- **Clarity**: Explicitly separates the initial window setup from the sliding logic.
- **Simplicity**: Avoids conditional checks inside the main loops.

**Cons:**
- **Code Duplication**: Requires calling `Add()` and `Process()` in two different places.
- **Maintenance**: Changes to the logic need to be applied to both the initialization and the sliding phase.

</div>

### One-Pass Implementation

Alternatively, you can implement a fixed-size window in a single loop:

```csharp
for (int i = 0; i < input.Length; i++)
{
    Add(input[i]);

    if (i >= k - 1)
    {
        Process();
        Remove(input[i - k + 1]);
    }
}
```

<div class="text-sm">

**Pros:**
- **DRY**: All logic is contained within a single loop structure.
- **Conciseness**: Fewer lines of code and no duplicated logic calls.

**Cons:**
- **Index Math**: Calculating `i - k + 1` for removal is more prone to off-by-one errors.
- **Conditional Overhead**: The `if` condition is checked on every single iteration.

</div>

<div style="margin-top: 3rem;">
    <a href="/" class="back-link">← Back to Map</a>
</div>

<style>
    .back-link {
        display: inline-block;
        padding: 0.5rem 1rem;
        background-color: #6366f1;
        color: white;
        text-decoration: none;
        border-radius: 0.5rem;
        font-weight: 600;
        transition: background-color 0.2s;
    }
    .back-link:hover {
        background-color: #4f46e5;
    }
</style>
