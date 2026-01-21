---
title: 'Sliding Window Pattern'
layout: ../../layouts/main.astro
---

# Sliding Window Pattern

> **Right in. Left out. End of story.** - *(c) JSON Statham*

Sliding Window is a powerful optimization for *monotonic* contiguous range problems. Its core mantra is simple: **reuse, don't recompute**. Instead of re-evaluating every range from scratch, you maintain a dynamic "window" and update it incrementally as it slides. This replaces redundant **O(n²)** nested loops with a single, high-performance **O(n)** scan.

## Core Concepts

Sliding Window problems generally fall into **three sub-patterns**:

1. **Fixed Size Sliding Window** — the window size is known and constant.  
2. **Longest Sliding Window** — find the longest contiguous subarray/substring satisfying a condition (e.g., *at most K* constraints).  
3. **Shortest Sliding Window** — find the shortest contiguous subarray/substring satisfying a condition (e.g., *at least K* constraints).

With these sub-patterns in mind, there are two fundamental ideas to understand:

### 1. Validity
**Validity** defines whether the current window satisfies the problem constraints (e.g., `sum <= K`, `at most K distinct characters`). Only valid windows contribute to the answer. In code sample below, this is represented by a `window.IsValid()` check.

### 2. Monotonicity
**Monotonicity** is what makes Sliding Window O(n). It ensures that moving the window boundaries (`left` and `right`) has a predictable effect on validity.

- **Longest Sliding Window**:  
  - Expanding the window (`right++`) can break validity.  
  - Once invalid, further expansion cannot restore validity until `left` moves.  
  - Shrinking the window (`left++`) restores validity.

- **Shortest Sliding Window**:  
  - Expanding (`right++`) maintains or creates validity.  
  - Once valid, further expansion keeps it valid.  
  - Shrinking (`left++`) moves toward invalidity, helping find the minimum window.

## Subpatterns

### 1. Fixed Size Sliding Window

Used when the window size is known in advance and remains constant.

```csharp
Window window = new();
int left = 0;
int fixedSize = 5;

for (int right = 0; right < input.Length; right++)
{
    // Add element from the right
    window.Add(input[right]);

    // If window exceeds fixed size, remove element from the left
    if (right - left + 1 > fixedSize)
    {
        window.Remove(input[left]);
        left++;
    }

    // If window is full and valid — update answer
    if (right - left + 1 == fixedSize && window.IsValid())
        UpdateAnswer(left, right);
}
```

### 2. Longest Sliding Window

Used to find the longest subarray that satisfies a specific condition.

```csharp
Window window = new();
int left = 0;

for (int right = 0; right < input.Length; right++)
{
    // Add element from the right
    window.Add(input[right]);

    // Shrink only if the window becomes invalid
    while (left <= right && !window.IsValid())
    {
        window.Remove(input[left]);
        left++;
    }

    // Window is valid — update global maximum
    if (window.IsValid())
        UpdateAnswer(left, right);
}
```

### 3. Shortest Sliding Window

Used to find the shortest subarray that satisfies a specific condition.

```csharp
Window window = new();
int left = 0;

for (int right = 0; right < input.Length; right++)
{
    // Add element from the right
    window.Add(input[right]);

    // Shrink the window as much as possible while it remains valid
    while (left <= right && window.IsValid())
    {
        // While valid — update global minimum
        UpdateAnswer(left, right);
        
        window.Remove(input[left]);
        left++;
    }
}
```

> 💡 **Tip:** To calculate the current window size, use the formula:  
> **`size = right - left + 1`**

> 💡 **Tip:** To find the result for **exactly K**, often you should calculate the difference between two "at most" results:  
> **`exactly(K) = atMost(K) - atMost(K - 1)`**

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
