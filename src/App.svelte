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

  function exportData(format) {
    if (filteredRoster.length === 0) {
      alert("No data to export.");
      return;
    }

    let content, filename, type;

    if (format === 'json') {
      content = JSON.stringify(filteredRoster, null, 2);
      filename = 'student-data.json';
      type = 'application/json';
    } else if (format === 'csv') {
      // Get all unique keys across all student objects
      const keys = new Set();
      filteredRoster.forEach(student => {
        Object.keys(student).forEach(key => keys.add(key));
      });
      const headers = Array.from(keys);
      
      // Create CSV content
      const csvRows = [headers.join(',')];
      
      filteredRoster.forEach(student => {
        const row = headers.map(header => {
          const value = student[header] || '';
          // Handle values that contain commas, quotes, etc.
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csvRows.push(row.join(','));
      });
      
      content = csvRows.join('\n');
      filename = 'student-data.csv';
      type = 'text/csv';
    } else {
      alert('Unsupported export format');
      return;
    }

    // Create a downloadable blob
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }
</script>

<div>
  <div class="top-bar">
    <div>
      {filteredRoster.length} record{filteredRoster.length === 1 ? "" : "s"} displayed
    </div>
    <div>
      <button on:click={copyEmails}>Copy Emails</button>
      <div class="export-dropdown">
        <button class="export-btn">Export Data</button>
        <div class="export-content">
          <button on:click={() => exportData('json')}>JSON</button>
          <button on:click={() => exportData('csv')}>CSV</button>
        </div>
      </div>
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
  .export-dropdown {
    position: relative;
    display: inline-block;
  }
  .export-content {
    display: none;
    position: absolute;
    background-color: #f9f9f9;
    min-width: 120px;
    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
    z-index: 1;
    border-radius: 4px;
  }
  .export-content button {
    color: black;
    background: white;
    padding: 12px 16px;
    display: block;
    width: 100%;
    text-align: left;
    border: none;
  }
  .export-content button:hover {
    background-color: #f1f1f1;
    color: #005ea2;
  }
  .export-dropdown:hover .export-content {
    display: block;
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
