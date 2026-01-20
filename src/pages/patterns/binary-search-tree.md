---
title: 'Binary Search Tree (BST)'
layout: ../../layouts/main.astro
---

# Binary Search Tree (BST)

> **"Half the work, double the speed."**

A **Binary Search Tree (BST)** is a rooted binary tree data structure with the following properties:
- The **left subtree** of a node contains only nodes with keys **less than** the node's key.
- The **right subtree** of a node contains only nodes with keys **greater than** the node's key.
- Both the left and right subtrees must also be binary search trees.

This ordering property makes BSTs ideal for efficient searching, as each comparison allows you to skip half of the remaining tree (similar to binary search on an array).

## Core Operations

### 1. Search
To find a value, start at the root:
- If `value == root.val`, return the node.
- If `value < root.val`, search the left subtree.
- If `value > root.val`, search the right subtree.

### 2. Inorder Traversal
An **Inorder Traversal** (`Left -> Root -> Right`) of a BST visits nodes in **strictly increasing order**. This is a fundamental property used to validate BSTs or extract sorted data.

### 3. Insertion & Deletion
- **Insertion**: Always happens at a leaf node. Search for the value until you hit a `null` spot, then place the new node there.
- **Deletion**: More complex; requires handling three cases: leaf node, node with one child, and node with two children (replace with inorder successor).

## Complexity Analysis

| Operation | Average Case | Worst Case (Skewed Tree) |
| :--- | :--- | :--- |
| **Search** | O(log n) | O(n) |
| **Insert** | O(log n) | O(n) |
| **Delete** | O(log n) | O(n) |

> 💡 **Tip:** To avoid the **O(n)** worst case, use **Self-Balancing BSTs** like AVL Trees or Red-Black Trees.

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
