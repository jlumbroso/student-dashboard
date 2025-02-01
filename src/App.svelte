<script>
  import log from "loglevel";
  import UploadButtons from "./components/UploadButtons.svelte";
  import FilterBar from "./components/FilterBar.svelte";
  import StudentGrid from "./components/StudentGrid.svelte";
  import StudentList from "./components/StudentList.svelte";
  import { roster, filters } from "./lib/store.js";

  log.setLevel("debug");

  let viewMode = "grid";

  // Filtering: if searchTags exist, each tag must appear in the student's full name or email.
  $: filteredRoster = $roster.filter((student) => {
    let passes = true;
    if ($filters.searchTags && $filters.searchTags.length > 0) {
      const fullName = (
        (student.First || "") +
        " " +
        (student.Last || "")
      ).toLowerCase();
      const email = (student.EmailAddress || "").toLowerCase();
      for (const tag of $filters.searchTags) {
        const tagLower = tag.toLowerCase();
        if (!fullName.includes(tagLower) && !email.includes(tagLower)) {
          passes = false;
          break;
        }
      }
    }
    if ($filters.hasGitHub === true && !student.githubUsername) passes = false;
    if ($filters.hasGitHub === false && student.githubUsername) passes = false;
    if ($filters.hasSlack === true && !student.slackUserId) passes = false;
    if ($filters.hasSlack === false && student.slackUserId) passes = false;
    if ($filters.major) {
      const studentMajor = (
        student["Primary Major Title"] ||
        student["Primary Major"] ||
        ""
      ).toLowerCase();
      if (!studentMajor.includes($filters.major.toLowerCase())) passes = false;
    }
    if ($filters.classification) {
      if (
        (student.Classification || "").toLowerCase() !==
        $filters.classification.toLowerCase()
      )
        passes = false;
    }
    return passes;
  });

  $: log.debug("Filtered roster count:", filteredRoster.length);

  function setView(mode) {
    viewMode = mode;
  }

  function clearRecords() {
    if (confirm("Are you sure you want to clear all records?")) {
      roster.set([]);
    }
  }
</script>

<div>
  <div class="status-bar">
    {filteredRoster.length} record{filteredRoster.length === 1 ? "" : "s"} displayed.
  </div>

  <UploadButtons />
  <FilterBar />

  <div class="view-switcher">
    <button on:click={() => setView("grid")} class:active={viewMode === "grid"}
      >Grid View</button
    >
    <button on:click={() => setView("list")} class:active={viewMode === "list"}
      >List View</button
    >
    <button on:click={clearRecords} class="clear-btn">Clear All Records</button>
  </div>

  {#if filteredRoster.length === 0}
    <p style="text-align:center; color:#666;">
      No students found. Upload data or adjust filters.
    </p>
  {:else if viewMode === "grid"}
    <StudentGrid {filteredRoster} />
  {:else}
    <StudentList {filteredRoster} />
  {/if}
</div>

<style>
  .view-switcher {
    margin: 1rem 0;
    text-align: center;
  }
  .view-switcher button {
    padding: 0.5rem 1rem;
    margin: 0.25rem;
    border: none;
    background: #007acc;
    color: white;
    cursor: pointer;
    border-radius: 4px;
    transition: background 0.2s;
  }
  .view-switcher button.active,
  .view-switcher button:hover {
    background: #005ea2;
  }
  .status-bar {
    text-align: center;
    font-size: 0.9rem;
    color: #333;
    margin-bottom: 1rem;
  }
  .clear-btn {
    margin-top: 0.5rem;
    background: #e74c3c;
  }
</style>
