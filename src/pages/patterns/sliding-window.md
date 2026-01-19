---
title: 'Sliding Window Pattern'
layout: ../../layouts/main.astro
---

# Sliding Window Pattern

> **Right in. Left out. End of story.** - *(c) JSON Statham*

Sliding Window is a technique for processing contiguous subarrays (or substrings) efficiently. The core principle is simple: **don’t recompute, maintain state while scanning**.

Instead of starting from scratch for every range, you maintain a "window" and move it step-by-step, updating only the elements that enter or leave. This reduces many brute-force solutions from **O(n²)** to **O(n)**.

## Sliding Window Master Template

This universal template works for both fixed and variable-sized windows.

```csharp
Window window = new();
int left = 0;

for (int right = 0; right < input.Length; right++)
{
    // 1. "Right in": Add the new element
    window.Add(input[right]);

    // 2. "Left out": Shrink window while the condition is violated
    while (left <= right && !window.IsValid())
    {
        window.Remove(input[left]);
        left++;
    }

    // 3. Update the global answer
    if (window.IsValid())
        UpdateAnswer(left, right);
}
```

> 💡 **Tip:** To calculate the **number of elements** (size) currently in the window:  
> **`size = right - left + 1`**

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
