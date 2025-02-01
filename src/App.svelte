<script>
  import log from "loglevel";
  import UploadButtons from "./components/UploadButtons.svelte";
  import FilterBar from "./components/FilterBar.svelte";
  import StudentGrid from "./components/StudentGrid.svelte";
  import StudentList from "./components/StudentList.svelte";
  import { roster, filters } from "./lib/store.js";

  log.setLevel("debug");

  let viewMode = "grid";

  // Filtering logic.
  $: filteredRoster = $roster.filter((student) => {
    let passes = true;
    // Free-text search: check name or email.
    if ($filters.search && $filters.search.trim() !== "") {
      const searchLower = $filters.search.toLowerCase();
      const fullName = (
        (student.First || "") +
        " " +
        (student.Last || "")
      ).toLowerCase();
      const email = (student.EmailAddress || "").toLowerCase();
      if (!fullName.includes(searchLower) && !email.includes(searchLower)) {
        passes = false;
      }
    }
    // GitHub toggle.
    if ($filters.hasGitHub === "yes" && !student.githubUsername) passes = false;
    if ($filters.hasGitHub === "no" && student.githubUsername) passes = false;
    // Slack toggle.
    if ($filters.hasSlack === "yes" && !student.slackUserId) passes = false;
    if ($filters.hasSlack === "no" && student.slackUserId) passes = false;
    // Major dropdown.
    if ($filters.major && $filters.major !== "all") {
      const majorLower = $filters.major.toLowerCase();
      const studentMajor = (
        student["Primary Major Title"] ||
        student["Primary Major"] ||
        ""
      ).toLowerCase();
      if (!studentMajor.includes(majorLower)) passes = false;
    }
    // Classification dropdown.
    if ($filters.classification && $filters.classification !== "all") {
      if (
        (student.Classification || "").toLowerCase() !==
        $filters.classification.toLowerCase()
      ) {
        passes = false;
      }
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

  async function copyEmails() {
    const emails = filteredRoster
      .map((student) => student.EmailAddress)
      .filter((email) => email && email.trim() !== "");
    try {
      await navigator.clipboard.writeText(emails.join(", "));
      alert(`Copied ${emails.length} emails to clipboard.`);
    } catch (err) {
      alert("Failed to copy emails: " + err);
    }
  }
</script>

<div>
  <div class="top-bar">
    <div>
      {filteredRoster.length} record{filteredRoster.length === 1 ? "" : "s"} displayed
    </div>
    <div>
      <button on:click={copyEmails}>Copy Emails</button>
      <button on:click={clearRecords}>Clear All Records</button>
    </div>
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
  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }
  .top-bar button {
    padding: 0.5rem 1rem;
    margin: 0.25rem;
    border: none;
    background: #007acc;
    color: white;
    cursor: pointer;
    border-radius: 4px;
  }
  .top-bar button:hover {
    background: #005ea2;
  }
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
  }
  .view-switcher button.active,
  .view-switcher button:hover {
    background: #005ea2;
  }
</style>
