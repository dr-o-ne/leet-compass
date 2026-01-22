---
title: 'Sliding Window Pattern'
layout: ../../layouts/main.astro
---

# Sliding Window Pattern

> **Right in. Left out. End of story.** - *(c) JSON Statham*

Sliding Window is used for problems where subarrays are processed sequentially, and changing the boundaries predictably affects the condition. Its core mantra is simple: **reuse, don't recompute**. Instead of re-evaluating every range from scratch, you maintain a dynamic "window" and update it incrementally as it slides. This usually replaces **O(n²)** nested loops with a single **O(n)** scan.

## Core Concepts

Sliding Window problems generally fall into **three sub-patterns**:

1. **Fixed Size Sliding Window** - the window size is known and constant.  
2. **Longest Sliding Window** - find the longest contiguous subarray/substring satisfying a condition (e.g., *at most K* constraints).  
3. **Shortest Sliding Window** - find the shortest contiguous subarray/substring satisfying a condition (e.g., *at least K* constraints).

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

    // Remove element from the left if window is too big
    if (right - left + 1 > fixedSize)
    {
        window.Remove(input[left]);
        left++;
    }

    // If window is full and valid - update answer
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

    // Window is valid - update global maximum
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
        // While valid - update global minimum
        UpdateAnswer(left, right);
        
        window.Remove(input[left]);
        left++;
    }
}
```

These are patterns, not prescriptions - use them as guidance, not as rigid templates

## Practical Example: Minimum Window Substring

Let's look at a classic Hard problem - [76. Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring/).

At first glance, using a dedicated `Window` class in pattern might seem like overkill for this problem. However, look how it separates the **traversal logic** (the sliding boundaries) from the **state logic** (how we count characters and define validity).

By encapsulating the state in a class, the main algorithm remains almost identical to the abstract "Shortest Window" template, making it easier to reason about and debug.

```csharp
private sealed class Window
{
    private readonly int[] template = new int[52];
    private readonly int[] state = new int[52];    
    private int formed = 0;
    private int required = 0;
    
    public Window(string t)
    {
        foreach (char c in t)
        {
            int idx = GetIndex(c);
            if (template[idx] == 0)
                required++;
            template[idx]++;
        }
    }

    public void Add(char c)
    {
        int idx = GetIndex(c);
        state[idx]++;
        if (state[idx] == template[idx])
            formed++;
    }

    public void Remove(char c)
    {
        int idx = GetIndex(c);
        if (state[idx] == template[idx])
            formed--;
        state[idx]--;
    }

    public bool IsValid() => formed == required;

    private int GetIndex(char c) =>
        char.IsUpper(c) ? c - 'A' : c - 'a' + 26;
}

public string MinWindow(string s, string t)
{
    if (string.IsNullOrEmpty(s) || string.IsNullOrEmpty(t))
        return "";

    Window window = new(t);

    int minLen = int.MaxValue;
    int minStart = 0;

    int left = 0; 
    for (int right = 0; right < s.Length; right++)
    {
        window.Add(s[right]);

        // Same boundary logic as the "Shortest Window" template
        while (left <= right && window.IsValid())
        {
            int size = right - left + 1;
            if (size < minLen)
            {
                minLen = size;
                minStart = left;
            }

            window.Remove(s[left]);
            left++;
        }
    }

    return minLen == int.MaxValue ? "" : s.Substring(minStart, minLen);
}
```

> 💡 **Tip:** To calculate the current window size, use the formula:  
> **`size = right - left + 1`**

> 💡 **Tip:** To find the result for **exactly K**, often you should calculate the difference between two "at most" results:  
> **`exactly(K) = atMost(K) - atMost(K - 1)`**

<div style="margin-top: 3rem;">
    <a href="/leet-compass/" class="back-link">← Back to Map</a>
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
