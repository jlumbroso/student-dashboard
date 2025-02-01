<script>
  import { filters, roster } from "../lib/store.js";
  import { derived } from "svelte/store";

  // Compute distinct major values.
  const distinctMajors = derived(roster, ($roster) => {
    const majors = new Set();
    $roster.forEach((student) => {
      const major = student["Primary Major Title"] || student["Primary Major"];
      if (major) majors.add(major);
    });
    return Array.from(majors).sort();
  });

  // Compute distinct classification values.
  const distinctClassifications = derived(roster, ($roster) => {
    const classes = new Set();
    $roster.forEach((student) => {
      const cl = student.Classification;
      if (cl) classes.add(cl);
    });
    return Array.from(classes).sort();
  });

  // Helper to update a filter.
  function updateFilter(key, value) {
    filters.update((f) => ({ ...f, [key]: value }));
  }
</script>

<div class="filter-bar">
  <!-- Free-text Search -->
  <div class="filter-item">
    <label for="searchInput">Search:</label>
    <input
      id="searchInput"
      type="text"
      placeholder="Name or Email"
      on:input={(e) => updateFilter("search", e.target.value)}
    />
  </div>

  <!-- GitHub Toggle using fieldset -->
  <fieldset class="filter-item">
    <legend>GitHub:</legend>
    <div class="toggle-group">
      <button
        type="button"
        class:active={$filters.hasGitHub === "all"}
        on:click={() => updateFilter("hasGitHub", "all")}
      >
        All
      </button>
      <button
        type="button"
        class:active={$filters.hasGitHub === "yes"}
        on:click={() => updateFilter("hasGitHub", "yes")}
      >
        Yes
      </button>
      <button
        type="button"
        class:active={$filters.hasGitHub === "no"}
        on:click={() => updateFilter("hasGitHub", "no")}
      >
        No
      </button>
    </div>
  </fieldset>

  <!-- Slack Toggle using fieldset -->
  <fieldset class="filter-item">
    <legend>Slack:</legend>
    <div class="toggle-group">
      <button
        type="button"
        class:active={$filters.hasSlack === "all"}
        on:click={() => updateFilter("hasSlack", "all")}
      >
        All
      </button>
      <button
        type="button"
        class:active={$filters.hasSlack === "yes"}
        on:click={() => updateFilter("hasSlack", "yes")}
      >
        Yes
      </button>
      <button
        type="button"
        class:active={$filters.hasSlack === "no"}
        on:click={() => updateFilter("hasSlack", "no")}
      >
        No
      </button>
    </div>
  </fieldset>

  <!-- Major Dropdown -->
  <div class="filter-item">
    <label for="majorSelect">Major:</label>
    <select
      id="majorSelect"
      on:change={(e) => updateFilter("major", e.target.value)}
    >
      <option value="all">All</option>
      {#each $distinctMajors as major}
        <option value={major}>{major}</option>
      {/each}
    </select>
  </div>

  <!-- Classification Dropdown -->
  <div class="filter-item">
    <label for="classSelect">Classification:</label>
    <select
      id="classSelect"
      on:change={(e) => updateFilter("classification", e.target.value)}
    >
      <option value="all">All</option>
      {#each $distinctClassifications as cl}
        <option value={cl}>{cl}</option>
      {/each}
    </select>
  </div>
</div>

<style>
  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem;
    background: #f8f8f8;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  .filter-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .filter-item label,
  fieldset legend {
    font-weight: bold;
  }
  input[type="text"],
  select {
    padding: 0.3rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  /* Styles for toggle groups using fieldset */
  fieldset {
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 0.3rem 0.5rem;
    margin: 0;
    display: inline-flex;
    align-items: center;
  }
  fieldset legend {
    margin-right: 0.5rem;
    padding: 0 0.3rem;
  }
  .toggle-group button {
    border: none;
    background: #fff;
    padding: 0.3rem 0.8rem;
    cursor: pointer;
    font-size: 0.9rem;
  }
  .toggle-group button.active {
    background: #007acc;
    color: #fff;
  }
  .toggle-group button:focus {
    outline: 2px solid #005ea2;
  }
</style>
