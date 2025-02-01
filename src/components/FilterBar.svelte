<script>
  import { filters, roster } from "../lib/store.js";
  import { derived } from "svelte/store";

  // Compute distinct major values from the roster.
  const distinctMajors = derived(roster, ($roster) => {
    const majors = new Set();
    $roster.forEach((student) => {
      // Try the "Primary Major Title" first, then "Primary Major"
      const major = student["Primary Major Title"] || student["Primary Major"];
      if (major) majors.add(major);
    });
    return Array.from(majors).sort();
  });

  // Compute distinct classification values from the roster.
  const distinctClassifications = derived(roster, ($roster) => {
    const classes = new Set();
    $roster.forEach((student) => {
      const cl = student.Classification;
      if (cl) classes.add(cl);
    });
    return Array.from(classes).sort();
  });

  // Event handlers for the text inputs.
  function onSearch(e) {
    filters.update((f) => ({ ...f, search: e.target.value }));
  }

  function onGitHubFilter(e) {
    const val = e.target.value;
    let boolVal = null;
    if (val === "yes") boolVal = true;
    if (val === "no") boolVal = false;
    filters.update((f) => ({ ...f, hasGitHub: boolVal }));
  }

  function onSlackFilter(e) {
    const val = e.target.value;
    let boolVal = null;
    if (val === "yes") boolVal = true;
    if (val === "no") boolVal = false;
    filters.update((f) => ({ ...f, hasSlack: boolVal }));
  }

  function onMajorFilter(e) {
    filters.update((f) => ({ ...f, major: e.target.value }));
  }

  function onClassificationFilter(e) {
    filters.update((f) => ({ ...f, classification: e.target.value }));
  }

  // When a tag is clicked, update the corresponding filter.
  function selectMajor(tag) {
    filters.update((f) => ({ ...f, major: tag }));
  }

  function selectClassification(tag) {
    filters.update((f) => ({ ...f, classification: tag }));
  }
</script>

<div class="filter-bar">
  <!-- Standard text input filters -->
  <div class="filter-row">
    <label for="search">Search:</label>
    <input
      id="search"
      type="text"
      placeholder="Name or Email"
      on:input={onSearch}
    />
  </div>
  <div class="filter-row">
    <label for="githubFilter">GitHub:</label>
    <select id="githubFilter" on:change={onGitHubFilter}>
      <option value="all">All</option>
      <option value="yes">Has GitHub</option>
      <option value="no">No GitHub</option>
    </select>
  </div>
  <div class="filter-row">
    <label for="slackFilter">Slack:</label>
    <select id="slackFilter" on:change={onSlackFilter}>
      <option value="all">All</option>
      <option value="yes">Has Slack</option>
      <option value="no">No Slack</option>
    </select>
  </div>

  <!-- Major filter text input plus clickable tags -->
  <div class="filter-row">
    <label for="majorFilter">Major:</label>
    <input
      id="majorFilter"
      type="text"
      placeholder="e.g. Computer Science"
      on:input={onMajorFilter}
    />
  </div>
  <div class="tags">
    <span style="font-weight:bold;">Popular Majors:</span>
    {#each $distinctMajors as major}
      <span class="tag" on:click={() => selectMajor(major)}>{major}</span>
    {/each}
  </div>

  <!-- Classification filter text input plus clickable tags -->
  <div class="filter-row">
    <label for="classificationFilter">Classification:</label>
    <input
      id="classificationFilter"
      type="text"
      placeholder="e.g. SR, JR"
      on:input={onClassificationFilter}
    />
  </div>
  <div class="tags">
    <span style="font-weight:bold;">Popular Classifications:</span>
    {#each $distinctClassifications as cl}
      <span class="tag" on:click={() => selectClassification(cl)}>{cl}</span>
    {/each}
  </div>
</div>

<style>
  .filter-bar {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  .filter-row {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    align-items: center;
  }
  label {
    margin-right: 0.5rem;
    font-weight: bold;
  }
  input,
  select {
    padding: 0.25rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  .tags {
    margin-top: 0.5rem;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .tag {
    background: #007acc;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }
  .tag:hover {
    background: #005ea2;
  }
</style>
